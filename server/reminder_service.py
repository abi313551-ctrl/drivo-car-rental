import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from models import Booking, BookingReminder, Notification, User, Car
from email_service import (
    send_email_message,
    is_smtp_configured,
    build_confirmation_email,
    build_pickup_reminder_email,
    build_return_reminder_email,
    build_cancellation_email,
)
from schemas import parse_iso_dt


def serialize_reminder(r: BookingReminder) -> dict:
    return {
        "id": r.id,
        "bookingId": r.booking_id,
        "bookingRef": r.booking_ref,
        "userId": r.user_id,
        "recipientEmail": r.recipient_email,
        "recipientName": r.recipient_name,
        "reminderType": r.reminder_type,
        "channel": r.channel,
        "scheduledFor": r.scheduled_for.isoformat() if r.scheduled_for else None,
        "sentAt": r.sent_at.isoformat() if r.sent_at else None,
        "status": r.status,
        "retryCount": r.retry_count,
        "maxRetries": r.max_retries,
        "errorDetails": r.error_details,
        "subject": r.subject,
        "messageBody": r.message_body,
        "createdAt": r.created_at.isoformat() if r.created_at else None,
    }


def schedule_booking_reminders(db: Session, booking: Booking) -> List[BookingReminder]:
    """
    Schedules booking confirmation, pickup reminder (24h before),
    and return reminder (3h before) in MySQL.
    Guarantees duplicate-send prevention and respects customer notification preferences.
    """
    created_reminders = []
    cust = booking.customer if isinstance(booking.customer, dict) else {}
    email = (cust.get("email") or "").lower().strip()
    name = (cust.get("fullName") or "Valued Customer").strip()

    if not email:
        return []

    # Check customer notification preferences if registered user
    user = None
    email_enabled = True
    pickup_pref = True
    return_pref = True
    if booking.user_id:
        user = db.query(User).filter(User.id == booking.user_id).first()
        if user:
            email_enabled = getattr(user, "email_notifs_enabled", True)
            pickup_pref = getattr(user, "pickup_reminders_enabled", True)
            return_pref = getattr(user, "return_reminders_enabled", True)

    car = booking.car or db.query(Car).filter(Car.id == booking.car_id).first()
    car_dict = {
        "brand": car.brand if car else "Vehicle",
        "model": car.model if car else "",
    }
    booking_dict = {
        "ref": booking.ref,
        "start": booking.start_time,
        "end": booking.end_time,
        "pickup": booking.pickup,
        "dropoff": booking.dropoff,
        "pricing": booking.pricing if isinstance(booking.pricing, dict) else {},
    }

    # 1. Booking Confirmation (Immediate)
    existing_conf = (
        db.query(BookingReminder)
        .filter(
            BookingReminder.booking_id == booking.id,
            BookingReminder.reminder_type == "booking_confirmation",
        )
        .first()
    )
    if not existing_conf:
        subject, text, html = build_confirmation_email(booking_dict, car_dict, name)
        conf_rem = BookingReminder(
            booking_id=booking.id,
            booking_ref=booking.ref,
            user_id=booking.user_id,
            recipient_email=email,
            recipient_name=name,
            reminder_type="booking_confirmation",
            channel="email",
            scheduled_for=datetime.utcnow(),  # Ready immediately
            status="pending",
            subject=subject,
            message_body=text,
        )
        db.add(conf_rem)
        created_reminders.append(conf_rem)

    # 2. Pickup Reminder (24 hours prior to pickup)
    if email_enabled and pickup_pref:
        existing_pickup = (
            db.query(BookingReminder)
            .filter(
                BookingReminder.booking_id == booking.id,
                BookingReminder.reminder_type == "pickup_reminder",
            )
            .first()
        )
        if not existing_pickup:
            try:
                start_dt = parse_iso_dt(booking.start_time)
                # 24 hours before pickup
                scheduled_pickup = start_dt - timedelta(hours=24)
                # If booking starts sooner than 24h, schedule in 5 minutes
                if scheduled_pickup <= datetime.utcnow():
                    scheduled_pickup = datetime.utcnow() + timedelta(minutes=5)

                subject, text, html = build_pickup_reminder_email(booking_dict, car_dict, name)
                pickup_rem = BookingReminder(
                    booking_id=booking.id,
                    booking_ref=booking.ref,
                    user_id=booking.user_id,
                    recipient_email=email,
                    recipient_name=name,
                    reminder_type="pickup_reminder",
                    channel="email",
                    scheduled_for=scheduled_pickup,
                    status="pending",
                    subject=subject,
                    message_body=text,
                )
                db.add(pickup_rem)
                created_reminders.append(pickup_rem)
            except Exception:
                pass

    # 3. Return Reminder (3 hours prior to return)
    if email_enabled and return_pref:
        existing_return = (
            db.query(BookingReminder)
            .filter(
                BookingReminder.booking_id == booking.id,
                BookingReminder.reminder_type == "return_reminder",
            )
            .first()
        )
        if not existing_return:
            try:
                end_dt = parse_iso_dt(booking.end_time)
                # 3 hours before return
                scheduled_return = end_dt - timedelta(hours=3)
                if scheduled_return <= datetime.utcnow():
                    scheduled_return = datetime.utcnow() + timedelta(minutes=10)

                subject, text, html = build_return_reminder_email(booking_dict, car_dict, name)
                return_rem = BookingReminder(
                    booking_id=booking.id,
                    booking_ref=booking.ref,
                    user_id=booking.user_id,
                    recipient_email=email,
                    recipient_name=name,
                    reminder_type="return_reminder",
                    channel="email",
                    scheduled_for=scheduled_return,
                    status="pending",
                    subject=subject,
                    message_body=text,
                )
                db.add(return_rem)
                created_reminders.append(return_rem)
            except Exception:
                pass

    db.commit()
    return created_reminders


def cancel_booking_reminders(db: Session, booking: Booking) -> int:
    """
    Cancels any pending reminders when a booking is cancelled.
    Schedules an immediate cancellation email notification.
    """
    # 1. Mark pending scheduled reminders as cancelled
    pending_reminders = (
        db.query(BookingReminder)
        .filter(
            BookingReminder.booking_id == booking.id,
            BookingReminder.status == "pending",
        )
        .all()
    )
    cancelled_count = 0
    for r in pending_reminders:
        r.status = "cancelled"
        r.error_details = "Cancelled: Booking was cancelled prior to reminder dispatch."
        cancelled_count += 1

    # 2. Schedule immediate cancellation notice
    cust = booking.customer if isinstance(booking.customer, dict) else {}
    email = (cust.get("email") or "").lower().strip()
    name = (cust.get("fullName") or "Valued Customer").strip()

    car = booking.car or db.query(Car).filter(Car.id == booking.car_id).first()
    car_dict = {
        "brand": car.brand if car else "Vehicle",
        "model": car.model if car else "",
    }
    booking_dict = {"ref": booking.ref}

    subject, text, html = build_cancellation_email(booking_dict, car_dict, name)
    cancel_rem = BookingReminder(
        booking_id=booking.id,
        booking_ref=booking.ref,
        user_id=booking.user_id,
        recipient_email=email,
        recipient_name=name,
        reminder_type="booking_cancellation",
        channel="email",
        scheduled_for=datetime.utcnow(),
        status="pending",
        subject=subject,
        message_body=text,
    )
    db.add(cancel_rem)
    db.commit()

    return cancelled_count


def process_due_reminders(db: Session, limit: int = 25) -> dict:
    """
    Scans for scheduled reminders due for dispatch (scheduled_for <= utcnow and status in pending/failed).
    Validates booking status (skips cancelled bookings), dispatches via email_service,
    tracks retries, prevents duplicate sends, and records in-app notifications.
    """
    now = datetime.utcnow()
    due_reminders = (
        db.query(BookingReminder)
        .filter(
            or_(
                BookingReminder.status == "pending",
                BookingReminder.status == "failed",
            ),
            BookingReminder.scheduled_for <= now,
            BookingReminder.retry_count < BookingReminder.max_retries,
        )
        .order_by(BookingReminder.scheduled_for.asc())
        .limit(limit)
        .all()
    )

    results = []
    smtp_ok = is_smtp_configured()
    mock_mode = os.getenv("DRIVO_EMAIL_MOCK", "false").lower() == "true"

    for rem in due_reminders:
        # Check booking existence and validity
        booking = db.query(Booking).filter(Booking.id == rem.booking_id).first()
        if not booking:
            rem.status = "skipped"
            rem.error_details = "Associated booking record no longer exists."
            results.append({"id": rem.id, "ref": rem.booking_ref, "status": "skipped"})
            continue

        # Prevent sending reminders for cancelled bookings (Requirement 11)
        if booking.status == "Cancelled" and rem.reminder_type != "booking_cancellation":
            rem.status = "cancelled"
            rem.error_details = "Booking was cancelled prior to reminder dispatch."
            results.append({"id": rem.id, "ref": rem.booking_ref, "status": "cancelled"})
            continue

        # Check user email preferences
        if rem.user_id:
            user = db.query(User).filter(User.id == rem.user_id).first()
            if user:
                if not getattr(user, "email_notifs_enabled", True):
                    rem.status = "skipped"
                    rem.error_details = "Customer opted out of email notifications."
                    results.append({"id": rem.id, "ref": rem.booking_ref, "status": "skipped"})
                    continue
                if rem.reminder_type == "pickup_reminder" and not getattr(user, "pickup_reminders_enabled", True):
                    rem.status = "skipped"
                    rem.error_details = "Customer opted out of pickup reminders."
                    results.append({"id": rem.id, "ref": rem.booking_ref, "status": "skipped"})
                    continue
                if rem.reminder_type == "return_reminder" and not getattr(user, "return_reminders_enabled", True):
                    rem.status = "skipped"
                    rem.error_details = "Customer opted out of return reminders."
                    results.append({"id": rem.id, "ref": rem.booking_ref, "status": "skipped"})
                    continue

        # Attempt sending
        success, message = send_email_message(
            to_email=rem.recipient_email,
            recipient_name=rem.recipient_name,
            subject=rem.subject,
            text_content=rem.message_body,
        )

        if success:
            rem.status = "sent" if smtp_ok else "simulated"
            rem.sent_at = datetime.utcnow()
            rem.error_details = None if smtp_ok else message
            results.append({"id": rem.id, "ref": rem.booking_ref, "status": rem.status, "message": message})

            # Create in-app customer notification so it's visible in Customer Dashboard
            if rem.user_id:
                notif = Notification(
                    user_id=rem.user_id,
                    booking_ref=rem.booking_ref,
                    title=rem.subject,
                    message=rem.message_body[:400] + ("..." if len(rem.message_body) > 400 else ""),
                    type="reminder" if "Reminder" in rem.subject else "booking",
                    link=f"/dashboard?tab=upcoming",
                )
                db.add(notif)
        else:
            rem.retry_count += 1
            if rem.retry_count >= rem.max_retries:
                rem.status = "failed"
            rem.error_details = f"Attempt {rem.retry_count}/{rem.max_retries} failed: {message}"
            results.append({
                "id": rem.id,
                "ref": rem.booking_ref,
                "status": rem.status,
                "retries": rem.retry_count,
                "error": message,
            })

    db.commit()
    return {"processed": len(due_reminders), "results": results}

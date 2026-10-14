import os
import random
import uuid
import time
from pathlib import Path
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status, File, UploadFile, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from pdf_generator import generate_invoice_pdf

import asyncio
from database import Base, engine, SessionLocal, get_db, ACTIVE_DB_BACKEND
from models import (
    User,
    Car,
    Favorite,
    Coupon,
    Booking,
    ContactMessage,
    Review,
    Notification,
    SupportTicket,
    VehicleInspection,
    LoyaltyConfig,
    RewardTransaction,
    BookingReminder,
    DecorationPackage,
    WeddingDecorationBooking,
    Driver,
    DriverPricingConfig,
)
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_optional_user,
    get_admin_user,
)
from schemas import (
    RegisterRequest,
    LoginRequest,
    ProfileUpdateRequest,
    BookingCreateRequest,
    PaymentUpdateRequest,
    CarCreateUpdateRequest,
    ContactCreateRequest,
    CouponValidateRequest,
    PriceCalculateRequest,
    BookingStatusUpdateRequest,
    ReviewCreateRequest,
    SupportTicketCreateRequest,
    SupportTicketReplyRequest,
    SupportTicketStatusUpdateRequest,
    VehicleInspectionCreateRequest,
    LoyaltyConfigUpdateRequest,
    AdminPointsAdjustmentRequest,
    NotificationPreferencesUpdateRequest,
    DecorationPackageCreateUpdateRequest,
    WeddingDecorationBookingCreateRequest,
    WeddingBookingStatusUpdateRequest,
    DriverCreateUpdateRequest,
    DriverPricingConfigUpdateRequest,
    DriverAssignRequest,
    parse_iso_dt,
    validate_date_range,
    calculate_server_pricing,
)
from seed import seed_initial_data, BASE_FEATURES, EXTRA_FEATURES
from locations_data import SUPPORTED_LOCATIONS, get_locations_by_city, get_location_by_name
from email_service import get_email_config_status, is_smtp_configured
from reminder_service import (
    schedule_booking_reminders,
    cancel_booking_reminders,
    process_due_reminders,
    serialize_reminder,
)

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_ROOT = BASE_DIR / "uploads"
CAR_UPLOADS_DIR = UPLOADS_ROOT / "cars"
CAR_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
INSPECTION_UPLOADS_DIR = UPLOADS_ROOT / "inspections"
INSPECTION_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
DECOR_UPLOADS_DIR = UPLOADS_ROOT / "decorations"
DECOR_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp", "image/pjpeg"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()


async def reminder_scheduler_worker():
    """Background worker that periodically checks and processes scheduled reminders."""
    while True:
        try:
            await asyncio.sleep(60)
            db = SessionLocal()
            try:
                process_due_reminders(db)
            finally:
                db.close()
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"[Reminder Worker Error] {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    on_startup()
    worker_task = asyncio.create_task(reminder_scheduler_worker())
    yield
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="Drivo Car Rental API", version="1.0.0", lifespan=lifespan)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_ROOT)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ACTIVE_STATUSES = {"Pending", "Confirmed", "In Progress"}
CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def serialize_user(u: User) -> dict:
    return {
        "id": u.id,
        "fullName": u.full_name,
        "email": u.email,
        "phone": u.phone or "",
        "license": u.license_number or "",
        "role": u.role,
        "rewardPoints": getattr(u, "reward_points", 0) or 0,
        "lifetimePoints": getattr(u, "lifetime_points", 0) or 0,
        "tier": getattr(u, "tier", "Silver") or "Silver",
        "emailNotifsEnabled": bool(getattr(u, "email_notifs_enabled", True)),
        "pickupRemindersEnabled": bool(getattr(u, "pickup_reminders_enabled", True)),
        "returnRemindersEnabled": bool(getattr(u, "return_reminders_enabled", True)),
        "createdAt": u.created_at.isoformat() if u.created_at else None,
    }


def _ensure_list(val, fallback):
    if isinstance(val, list):
        return val
    if isinstance(val, str):
        try:
            import json
            parsed = json.loads(val)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass
    return fallback


def serialize_car(c: Car) -> dict:
    fallback_imgs = [c.image] if c.image else []
    images = _ensure_list(c.images, fallback_imgs)
    features = _ensure_list(c.features, [])
    return {
        "id": c.id,
        "brand": c.brand,
        "model": c.model,
        "year": c.year,
        "category": c.category,
        "fuel": c.fuel,
        "transmission": c.transmission,
        "seats": c.seats,
        "pricePerDay": c.price_per_day,
        "rating": c.rating,
        "location": c.location,
        "popularity": c.popularity,
        "image": c.image,
        "images": images if images else fallback_imgs,
        "deposit": c.deposit,
        "available": bool(c.available),
        "features": features,
        "description": c.description,
    }


def serialize_booking(b: Booking) -> dict:
    car = b.car
    car_snapshot = {
        "id": b.car_id,
        "brand": car.brand if car else "Car",
        "model": car.model if car else "",
        "year": car.year if car else 2024,
        "image": car.image if car else "",
        "category": car.category if car else "",
        "pricePerDay": car.price_per_day if car else 0,
        "location": car.location if car else "",
    }
    return {
        "id": b.id,
        "ref": b.ref,
        "userId": b.user_id,
        "carId": b.car_id,
        "car": car_snapshot,
        "pickup": b.pickup,
        "dropoff": b.dropoff,
        "pickupLocation": get_location_by_name(b.pickup),
        "dropoffLocation": get_location_by_name(b.dropoff),
        "start": b.start_time,
        "end": b.end_time,
        "customer": b.customer,
        "extras": b.extras,
        "pricing": b.pricing,
        "status": b.status,
        "paymentStatus": b.payment_status,
        "paymentMethod": b.payment_method,
        "createdAt": b.created_at.isoformat() if b.created_at else None,
        "cancelledAt": b.cancelled_at.isoformat() if b.cancelled_at else None,
    }


def serialize_review(r: Review) -> dict:
    return {
        "id": r.id,
        "carId": r.car_id,
        "bookingId": r.booking_id,
        "userId": r.user_id,
        "userName": r.user.full_name if r.user else "Verified Customer",
        "rating": r.rating,
        "title": r.title or "",
        "comment": r.comment,
        "createdAt": r.created_at.isoformat() if r.created_at else None,
        "isVerified": True,
    }


def serialize_notification(n: Notification) -> dict:
    return {
        "id": n.id,
        "userId": n.user_id,
        "bookingRef": n.booking_ref,
        "link": n.link,
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "read": bool(n.read),
        "createdAt": n.created_at.isoformat() if n.created_at else None,
    }


def serialize_decoration_package(p: DecorationPackage) -> dict:
    inc_items = p.included_items if isinstance(p.included_items, list) else []
    if isinstance(p.included_items, str):
        try:
            inc_items = json.loads(p.included_items)
        except Exception:
            inc_items = [p.included_items]

    compat_cats = p.compatible_categories
    if isinstance(compat_cats, str):
        try:
            compat_cats = json.loads(compat_cats)
        except Exception:
            compat_cats = None

    gallery = p.gallery if isinstance(p.gallery, list) else [p.image]
    return {
        "id": p.id,
        "name": p.name,
        "slug": p.slug,
        "theme": p.theme or "floral",
        "badge": p.badge or "",
        "subtitle": p.subtitle or "",
        "startingPrice": p.starting_price,
        "description": p.description,
        "category": p.category,
        "image": p.image,
        "gallery": gallery,
        "includedItems": inc_items,
        "compatibleCategories": compat_cats,
        "duration": p.duration,
        "serviceAreas": p.service_areas,
        "isActive": bool(p.is_active),
        "sortOrder": p.sort_order,
        "createdAt": p.created_at.isoformat() if p.created_at else None,
        "updatedAt": p.updated_at.isoformat() if p.updated_at else None,
    }


def serialize_driver(d: Driver) -> dict:
    return {
        "id": d.id,
        "name": d.name,
        "phone": d.phone,
        "licenseNumber": d.license_number,
        "experienceYears": d.experience_years,
        "rating": d.rating,
        "photo": d.photo,
        "isActive": bool(d.is_active),
        "city": d.city,
        "notes": d.notes or "",
        "createdAt": d.created_at.isoformat() if d.created_at else None,
    }


def serialize_driver_pricing_config(cfg: DriverPricingConfig) -> dict:
    return {
        "id": cfg.id,
        "baseDriverFee": cfg.base_driver_fee,
        "includedHours": cfg.included_hours,
        "includedKm": cfg.included_km,
        "overtimeRatePerHour": cfg.overtime_rate_per_hour,
        "extraKmRate": cfg.extra_km_rate,
        "isActive": bool(cfg.is_active),
        "updatedAt": cfg.updated_at.isoformat() if cfg.updated_at else None,
    }


def get_driver_pricing_config(db: Session) -> DriverPricingConfig:
    cfg = db.query(DriverPricingConfig).first()
    if not cfg:
        cfg = DriverPricingConfig(
            base_driver_fee=1000,
            included_hours=8,
            included_km=100,
            overtime_rate_per_hour=200,
            extra_km_rate=20,
            is_active=True,
        )
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg


def serialize_wedding_booking(b: WeddingDecorationBooking) -> dict:
    pkg = b.package
    pkg_snapshot = {
        "id": b.package_id,
        "name": pkg.name if pkg else "Decoration Package",
        "category": pkg.category if pkg else "Floral",
        "theme": pkg.theme if pkg else "floral",
        "image": pkg.image if pkg else "",
        "startingPrice": pkg.starting_price if pkg else 0,
    }
    car_snapshot = None
    if b.car_id and b.car:
        car_snapshot = {
            "id": b.car.id,
            "brand": b.car.brand,
            "model": b.car.model,
            "year": b.car.year,
            "image": b.car.image,
            "category": b.car.category,
            "pricePerDay": b.car.price_per_day,
            "deposit": b.car.deposit,
            "seats": b.car.seats,
            "transmission": b.car.transmission,
            "fuel": b.car.fuel,
        }

    driver_snapshot = serialize_driver(b.driver) if b.driver else None

    return {
        "id": b.id,
        "ref": b.ref,
        "userId": b.user_id,
        "packageId": b.package_id,
        "package": pkg_snapshot,
        "carId": b.car_id,
        "car": car_snapshot,
        "customerName": b.customer_name,
        "customerPhone": b.customer_phone,
        "customerEmail": b.customer_email,
        "eventType": b.event_type,
        "eventDate": b.event_date,
        "completionTime": b.completion_time,
        "venueLocation": b.venue_location,
        "pickupLocation": b.pickup_location or "",
        "destination": b.destination or "",
        "serviceCity": b.service_city,
        "driveMode": b.drive_mode or "with_driver",
        "expectedDurationHours": b.expected_duration_hours or 8,
        "expectedDistanceKm": b.expected_distance_km or 100,
        "driverId": b.driver_id,
        "driver": driver_snapshot,
        "flowerColors": b.flower_colors or "",
        "decorStyle": b.decor_style or "",
        "specialNotes": b.special_notes or "",
        "referenceImage": b.reference_image or "",
        "carRentalIncluded": bool(b.car_rental_included),
        "pricing": b.pricing if isinstance(b.pricing, dict) else {},
        "status": b.status,
        "paymentStatus": b.payment_status,
        "paymentMethod": b.payment_method,
        "adminNotes": b.admin_notes or "",
        "createdAt": b.created_at.isoformat() if b.created_at else None,
        "updatedAt": b.updated_at.isoformat() if b.updated_at else None,
    }


def generate_wedding_ref(db: Session) -> str:
    now = datetime.utcnow()
    d = f"{str(now.year)[2:]}{now.month:02d}{now.day:02d}"
    while True:
        suffix = "".join(random.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(5))
        ref = f"WED-{d}-{suffix}"
        if not db.query(WeddingDecorationBooking).filter(WeddingDecorationBooking.ref == ref).first():
            return ref


def get_loyalty_config(db: Session) -> LoyaltyConfig:
    cfg = db.query(LoyaltyConfig).first()
    if not cfg:
        cfg = LoyaltyConfig()
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg


def serialize_loyalty_config(cfg: LoyaltyConfig) -> dict:
    return {
        "pointsPer100Inr": cfg.points_per_100_inr,
        "redemptionValueInr": cfg.redemption_value_inr,
        "minPointsToRedeem": cfg.min_points_to_redeem,
        "maxDiscountPercent": cfg.max_discount_percent,
        "silverThreshold": cfg.silver_threshold,
        "goldThreshold": cfg.gold_threshold,
        "platinumThreshold": cfg.platinum_threshold,
        "goldMultiplier": cfg.gold_multiplier,
        "platinumMultiplier": cfg.platinum_multiplier,
        "isActive": bool(cfg.is_active),
    }


def calculate_user_tier(lifetime_points: int, cfg: LoyaltyConfig) -> str:
    if cfg.platinum_threshold > 0 and lifetime_points >= cfg.platinum_threshold:
        return "Platinum"
    if cfg.gold_threshold > 0 and lifetime_points >= cfg.gold_threshold:
        return "Gold"
    return "Silver"


def get_tier_multiplier(tier: str, cfg: LoyaltyConfig) -> float:
    if tier == "Platinum":
        return cfg.platinum_multiplier
    if tier == "Gold":
        return cfg.gold_multiplier
    return 1.0


def serialize_reward_transaction(tx: RewardTransaction) -> dict:
    return {
        "id": tx.id,
        "userId": tx.user_id,
        "bookingId": tx.booking_id,
        "bookingRef": tx.booking_ref,
        "transactionType": tx.transaction_type,
        "points": tx.points,
        "balanceAfter": tx.balance_after,
        "description": tx.description,
        "createdAt": tx.created_at.isoformat() if tx.created_at else None,
    }


def award_booking_rewards(db: Session, booking: Booking) -> Optional[int]:
    """Award reward points when an eligible booking is completed and paid."""
    if not booking.user_id:
        return None
    if booking.status != "Completed" or booking.payment_status != "Paid":
        return None

    # Duplicate reward prevention: check if points were already awarded
    existing = (
        db.query(RewardTransaction)
        .filter(
            RewardTransaction.booking_id == booking.id,
            RewardTransaction.transaction_type == "earned",
        )
        .first()
    )
    if existing:
        return None

    cfg = get_loyalty_config(db)
    if not cfg.is_active or cfg.points_per_100_inr <= 0:
        return None

    # Pessimistic lock on user row
    user = db.query(User).filter(User.id == booking.user_id).with_for_update().first()
    if not user:
        return None

    multiplier = get_tier_multiplier(user.tier, cfg)
    total_amount = 0
    if isinstance(booking.pricing, dict):
        total_amount = booking.pricing.get("total", 0)

    if total_amount <= 0:
        return None

    points_earned = max(1, int((total_amount / 100.0) * cfg.points_per_100_inr * multiplier))

    user.reward_points = (user.reward_points or 0) + points_earned
    user.lifetime_points = (user.lifetime_points or 0) + points_earned
    user.tier = calculate_user_tier(user.lifetime_points, cfg)

    tx = RewardTransaction(
        user_id=user.id,
        booking_id=booking.id,
        booking_ref=booking.ref,
        transaction_type="earned",
        points=points_earned,
        balance_after=user.reward_points,
        description=f"Reward points for completed booking {booking.ref} ({user.tier} tier)",
    )
    db.add(tx)

    notif = Notification(
        user_id=user.id,
        title="Reward Points Earned!",
        message=f"You earned {points_earned} Drivo Points for completed rental {booking.ref}. Current Balance: {user.reward_points} pts.",
        type="rewards",
    )
    db.add(notif)
    return points_earned


def refund_booking_rewards(db: Session, booking: Booking) -> None:
    """Refund redeemed points and clawback earned points if a booking is cancelled."""
    if not booking.user_id:
        return

    user = db.query(User).filter(User.id == booking.user_id).with_for_update().first()
    if not user:
        return

    cfg = get_loyalty_config(db)

    # 1. Refund redeemed points (if customer used points to get a discount)
    redeemed_tx = (
        db.query(RewardTransaction)
        .filter(
            RewardTransaction.booking_id == booking.id,
            RewardTransaction.transaction_type == "redeemed",
        )
        .first()
    )
    if redeemed_tx and abs(redeemed_tx.points) > 0:
        # Check if already refunded
        already_refunded = (
            db.query(RewardTransaction)
            .filter(
                RewardTransaction.booking_id == booking.id,
                RewardTransaction.transaction_type == "refunded",
            )
            .first()
        )
        if not already_refunded:
            pts_to_restore = abs(redeemed_tx.points)
            user.reward_points = (user.reward_points or 0) + pts_to_restore
            tx_refund = RewardTransaction(
                user_id=user.id,
                booking_id=booking.id,
                booking_ref=booking.ref,
                transaction_type="refunded",
                points=pts_to_restore,
                balance_after=user.reward_points,
                description=f"Refund of {pts_to_restore} redeemed points for cancelled booking {booking.ref}",
            )
            db.add(tx_refund)
            notif = Notification(
                user_id=user.id,
                title="Reward Points Restored",
                message=f"{pts_to_restore} points returned to your balance for cancelled booking {booking.ref}.",
                type="rewards",
            )
            db.add(notif)

    # 2. Clawback earned points if cancelled after being marked completed
    earned_tx = (
        db.query(RewardTransaction)
        .filter(
            RewardTransaction.booking_id == booking.id,
            RewardTransaction.transaction_type == "earned",
        )
        .first()
    )
    if earned_tx and earned_tx.points > 0:
        already_clawed = (
            db.query(RewardTransaction)
            .filter(
                RewardTransaction.booking_id == booking.id,
                RewardTransaction.transaction_type == "clawback",
            )
            .first()
        )
        if not already_clawed:
            pts_to_deduct = earned_tx.points
            user.reward_points = max(0, (user.reward_points or 0) - pts_to_deduct)
            user.lifetime_points = max(0, (user.lifetime_points or 0) - pts_to_deduct)
            user.tier = calculate_user_tier(user.lifetime_points, cfg)
            tx_claw = RewardTransaction(
                user_id=user.id,
                booking_id=booking.id,
                booking_ref=booking.ref,
                transaction_type="clawback",
                points=-pts_to_deduct,
                balance_after=user.reward_points,
                description=f"Clawback of {pts_to_deduct} earned points for cancelled booking {booking.ref}",
            )
            db.add(tx_claw)



def find_car_conflict(db: Session, car_id: int, start_str: str, end_str: str, ignore_ref: Optional[str] = None) -> Optional[Booking]:
    s_dt = parse_iso_dt(start_str)
    e_dt = parse_iso_dt(end_str)
    bookings = db.query(Booking).filter(Booking.car_id == car_id, Booking.status.in_(ACTIVE_STATUSES)).all()
    for b in bookings:
        if ignore_ref and b.ref == ignore_ref:
            continue
        try:
            bs = parse_iso_dt(b.start_time)
            be = parse_iso_dt(b.end_time)
            if s_dt < be and bs < e_dt:
                return b
        except Exception:
            continue
    return None


def generate_booking_ref(db: Session) -> str:
    now = datetime.utcnow()
    d = f"{str(now.year)[2:]}{now.month:02d}{now.day:02d}"
    while True:
        suffix = "".join(random.choice(CHARS) for _ in range(5))
        ref = f"DRV-{d}-{suffix}"
        if not db.query(Booking).filter(Booking.ref == ref).first():
            return ref


# --- Health & Locations ---
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Drivo FastAPI Backend", "database": ACTIVE_DB_BACKEND}


@app.get("/api/locations")
def list_locations(city: Optional[str] = None):
    """
    Returns verified, supported pickup and return locations.
    Optionally filter by city.
    """
    locs = get_locations_by_city(city)
    return {"ok": True, "count": len(locs), "locations": locs}


# --- Auth & Users ---
@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    user = User(
        full_name=payload.fullName.strip(),
        email=email,
        phone=(payload.phone or "").strip(),
        license_number=(payload.license or "").strip().upper(),
        password_hash=hash_password(payload.password),
        role="customer",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"token": token, "user": serialize_user(user)}


@app.post("/api/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"token": token, "user": serialize_user(user)}


@app.get("/api/auth/me")
def get_me(user: User = Depends(get_current_user)):
    return {"user": serialize_user(user)}


@app.put("/api/auth/me")
def update_me(payload: ProfileUpdateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.full_name = payload.fullName.strip()
    user.phone = (payload.phone or "").strip()
    user.license_number = (payload.license or "").strip().upper()
    db.commit()
    db.refresh(user)
    return {"user": serialize_user(user)}


# --- Cars ---
@app.get("/api/cars")
def list_cars(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    available_only: Optional[bool] = Query(False),
    db: Session = Depends(get_db),
):
    query = db.query(Car)
    if category and category.strip() and category.lower() != "all":
        query = query.filter(Car.category == category.strip())
    if location and location.strip():
        query = query.filter(Car.location == location.strip())
    cars = query.order_by(Car.id.asc()).all()

    conflicts_by_car_id = {}
    if start and end:
        try:
            s_dt, e_dt, _ = validate_date_range(start, end, check_past=False)
            active_bookings = (
                db.query(Booking)
                .filter(Booking.status.in_(ACTIVE_STATUSES))
                .all()
            )
            for b in active_bookings:
                try:
                    bs = parse_iso_dt(b.start_time)
                    be = parse_iso_dt(b.end_time)
                    if s_dt < be and bs < e_dt:
                        conflicts_by_car_id[b.car_id] = {
                            "start": b.start_time,
                            "end": b.end_time,
                            "ref": b.ref,
                            "status": b.status,
                        }
                except Exception:
                    continue
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    serialized = []
    for c in cars:
        c_dict = serialize_car(c)
        if start and end:
            conflict = conflicts_by_car_id.get(c.id)
            is_avail = bool(c.available) and (conflict is None)
            c_dict["isAvailableForPeriod"] = is_avail
            c_dict["periodConflict"] = conflict
            if available_only and not is_avail:
                continue
        else:
            c_dict["isAvailableForPeriod"] = bool(c.available)
            c_dict["periodConflict"] = None
        serialized.append(c_dict)

    return {
        "cars": serialized,
        "total": len(serialized),
        "period": {"start": start, "end": end} if start and end else None,
        "bookedCount": len(conflicts_by_car_id) if start and end else 0,
    }


@app.get("/api/cars/{car_id}")
def get_car(car_id: int, db: Session = Depends(get_db)):
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found.")
    return {"car": serialize_car(car)}


@app.get("/api/cars/{car_id}/availability")
def check_car_availability(
    car_id: int,
    start: str = Query(...),
    end: str = Query(...),
    db: Session = Depends(get_db),
):
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found.")
    if not car.available:
        return {"available": False, "reason": "Car is currently marked unavailable by fleet management."}
    try:
        validate_date_range(start, end, check_past=False)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    conflict = find_car_conflict(db, car_id, start, end)
    if conflict:
        return {
            "available": False,
            "reason": f"Vehicle is already reserved from {conflict.start_time} to {conflict.end_time}.",
            "conflict": {
                "start": conflict.start_time,
                "end": conflict.end_time,
                "ref": conflict.ref,
                "status": conflict.status,
            },
        }
    return {"available": True, "conflict": None, "reason": "Vehicle is available for the selected dates."}


def safe_delete_car_image_file(image_path: Optional[str], db: Session, exclude_car_id: Optional[int] = None):
    if not image_path or not isinstance(image_path, str):
        return
    if not image_path.startswith("/uploads/cars/"):
        return
    filename = Path(image_path).name
    # Prevent directory traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        return
    # Check if another car in the database references this image
    query = db.query(Car).filter(Car.image == image_path)
    if exclude_car_id is not None:
        query = query.filter(Car.id != exclude_car_id)
    if query.first():
        return
    file_on_disk = CAR_UPLOADS_DIR / filename
    try:
        if file_on_disk.is_file():
            file_on_disk.unlink()
    except OSError:
        pass


@app.post("/api/admin/cars/upload-image")
async def upload_car_image(
    file: UploadFile = File(...),
    admin: User = Depends(get_admin_user),
):
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No image file was provided.")

    orig_ext = Path(file.filename).suffix.lower()
    if orig_ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{orig_ext}'. Allowed formats: JPG, JPEG, PNG, WEBP.",
        )

    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_IMAGE_MIMES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file MIME type '{content_type}'. Must be a valid JPG, PNG, or WEBP image.",
        )

    chunk_size = 1024 * 64
    total_bytes = 0
    chunks = []
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total_bytes += len(chunk)
        if total_bytes > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum allowed size of 5 MB (received > 5 MB).",
            )
        chunks.append(chunk)

    if total_bytes == 0:
        raise HTTPException(status_code=400, detail="The uploaded image is empty (0 bytes).")

    unique_name = f"car_{int(time.time())}_{uuid.uuid4().hex[:10]}{orig_ext}"
    dest_path = CAR_UPLOADS_DIR / unique_name

    with open(dest_path, "wb") as f:
        for c in chunks:
            f.write(c)

    relative_url = f"/uploads/cars/{unique_name}"
    return {
        "url": relative_url,
        "filename": unique_name,
        "size": total_bytes,
        "contentType": content_type,
        "message": "Car image uploaded successfully.",
    }


@app.post("/api/cars", status_code=status.HTTP_201_CREATED)
def create_car(payload: CarCreateUpdateRequest, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    imgs = payload.images if payload.images else [payload.image]
    feats = payload.features if payload.features else BASE_FEATURES + EXTRA_FEATURES.get(payload.category, [])
    desc = payload.description or (
        f"The {payload.year} {payload.brand} {payload.model} is a {payload.fuel.lower()} "
        f"{payload.category.lower()} with {payload.transmission.lower()} transmission and room for {payload.seats}."
    )
    car = Car(
        brand=payload.brand.strip(),
        model=payload.model.strip(),
        year=payload.year,
        category=payload.category,
        fuel=payload.fuel,
        transmission=payload.transmission,
        seats=payload.seats,
        price_per_day=payload.pricePerDay,
        rating=4.6,
        location=payload.location,
        popularity=80,
        image=payload.image,
        images=imgs,
        deposit=payload.deposit,
        available=payload.available,
        features=feats,
        description=desc,
    )
    db.add(car)
    db.commit()
    db.refresh(car)
    return {"car": serialize_car(car)}


@app.patch("/api/cars/{car_id}/availability")
def toggle_car_availability(car_id: int, available: bool = Query(...), admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found.")
    car.available = available
    db.commit()
    db.refresh(car)
    return {"car": serialize_car(car)}


@app.put("/api/cars/{car_id}")
def update_car(car_id: int, payload: CarCreateUpdateRequest, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found.")
    old_image = car.image
    imgs = payload.images if payload.images else [payload.image]
    feats = payload.features if payload.features else car.features
    desc = payload.description or car.description
    car.brand = payload.brand.strip()
    car.model = payload.model.strip()
    car.year = payload.year
    car.category = payload.category
    car.fuel = payload.fuel
    car.transmission = payload.transmission
    car.seats = payload.seats
    car.price_per_day = payload.pricePerDay
    car.deposit = payload.deposit
    car.location = payload.location
    car.image = payload.image
    car.images = imgs
    car.features = feats
    car.description = desc
    car.available = payload.available
    db.commit()
    db.refresh(car)
    if old_image != car.image:
        safe_delete_car_image_file(old_image, db, exclude_car_id=car.id)
    return {"car": serialize_car(car)}


@app.delete("/api/cars/{car_id}")
def delete_car(car_id: int, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found.")
    active_b = db.query(Booking).filter(Booking.car_id == car_id, Booking.status.in_(ACTIVE_STATUSES)).first()
    if active_b:
        raise HTTPException(status_code=400, detail=f"Cannot delete car with active booking ({active_b.ref}). Mark as unavailable instead.")
    old_image = car.image
    db.delete(car)
    db.commit()
    safe_delete_car_image_file(old_image, db)
    return {"ok": True, "message": f"{car.brand} {car.model} removed from fleet."}



# --- Favorites ---
@app.get("/api/favorites")
def get_favorites(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    favs = db.query(Favorite).filter(Favorite.user_id == user.id).all()
    return {"favorites": [f.car_id for f in favs]}


@app.post("/api/favorites/{car_id}")
def toggle_favorite(car_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found.")
    existing = db.query(Favorite).filter(Favorite.user_id == user.id, Favorite.car_id == car_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        action = "removed"
    else:
        db.add(Favorite(user_id=user.id, car_id=car_id))
        db.commit()
        action = "added"
    favs = db.query(Favorite).filter(Favorite.user_id == user.id).all()
    return {"action": action, "favorites": [f.car_id for f in favs]}


@app.delete("/api/favorites")
def clear_favorites(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Favorite).filter(Favorite.user_id == user.id).delete()
    db.commit()
    return {"favorites": []}


# --- Coupons & Pricing ---
@app.get("/api/coupons")
def list_coupons(db: Session = Depends(get_db)):
    coupons = db.query(Coupon).all()
    return {
        "coupons": [
            {
                "code": c.code,
                "type": c.type,
                "value": c.value,
                "category": c.category,
                "weekendOnly": c.weekend_only,
                "active": c.active,
                "description": c.description,
            }
            for c in coupons
        ]
    }


# --- Bookings ---
@app.get("/api/bookings")
def list_bookings(user: Optional[User] = Depends(get_optional_user), db: Session = Depends(get_db)):
    # Returns all bookings. For public conflict checks, strips other customers' personal contact details
    # Fully detailed bookings returned if user is admin or booking owner
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).all()
    results = []
    is_admin = bool(user and user.role == "admin")
    curr_user_id = user.id if user else None
    curr_email = user.email.lower() if user else None

    for b in bookings:
        serialized = serialize_booking(b)
        is_owner = bool(
            is_admin or
            (curr_user_id and b.user_id == curr_user_id) or
            (curr_email and isinstance(b.customer, dict) and b.customer.get("email", "").lower() == curr_email)
        )
        if not is_owner:
            # Mask PII for other users while preserving start/end/status/carId for availability checks
            serialized["customer"] = {"fullName": "Verified Customer"}
        results.append(serialized)

    return {"bookings": results}


@app.get("/api/bookings/my")
def list_my_bookings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bookings = (
        db.query(Booking)
        .order_by(Booking.created_at.desc())
        .all()
    )
    user_bookings = [
        b for b in bookings
        if b.user_id == user.id or (isinstance(b.customer, dict) and b.customer.get("email", "").lower() == user.email.lower())
    ]
    return {"bookings": [serialize_booking(b) for b in user_bookings]}


@app.get("/api/bookings/{ref}")
def get_booking_by_ref(ref: str, user: Optional[User] = Depends(get_optional_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.ref == ref).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    # Mask customer details if the requester is neither the booking owner nor admin
    serialized = serialize_booking(booking)
    is_owner = bool(
        (user and user.role == "admin") or
        (user and booking.user_id == user.id) or
        (user and isinstance(booking.customer, dict) and booking.customer.get("email", "").lower() == user.email.lower()) or
        (not booking.user_id) # newly created guest/unregistered booking
    )
    if not is_owner:
        serialized["customer"] = {"fullName": "Verified Customer"}

    return {"booking": serialized}


@app.post("/api/bookings", status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreateRequest,
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    # 1. Validate date range logical order and duration
    try:
        validate_date_range(payload.start, payload.end, check_past=False)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        # 2. Acquire pessimistic row-level lock on the Car record to prevent concurrent double-booking races
        car = db.query(Car).filter(Car.id == payload.carId).with_for_update().first()
        if not car:
            raise HTTPException(status_code=404, detail="Selected car does not exist.")
        if not car.available:
            raise HTTPException(status_code=400, detail=f"{car.brand} {car.model} is currently marked unavailable.")

        # 3. Re-verify availability inside the locked transaction
        conflict = find_car_conflict(db, car.id, payload.start, payload.end)
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{car.brand} {car.model} is already booked from {conflict.start_time} to {conflict.end_time}. Please select different dates or choose another car.",
            )

        # 4. Coupon validation
        coupon_obj = None
        if payload.couponCode and payload.couponCode.strip():
            code = payload.couponCode.strip().upper()
            coupon_obj = db.query(Coupon).filter(Coupon.code == code).first()
            if not coupon_obj:
                raise HTTPException(status_code=400, detail=f"Coupon code '{code}' does not exist.")
            if not coupon_obj.active:
                raise HTTPException(status_code=400, detail=f"Coupon code '{code}' is no longer active.")

        cfg = get_loyalty_config(db)
        user_db = None
        user_pts = 0
        pts_to_redeem = payload.redeemPoints or 0
        if user and pts_to_redeem > 0:
            user_db = db.query(User).filter(User.id == user.id).with_for_update().first()
            user_pts = (user_db.reward_points or 0) if user_db else 0
            if not cfg.is_active or user_pts < cfg.min_points_to_redeem:
                pts_to_redeem = 0
        else:
            pts_to_redeem = 0

        # 5. Pricing calculation
        pricing = calculate_server_pricing(
            price_per_day=car.price_per_day,
            deposit=car.deposit,
            start_str=payload.start,
            end_str=payload.end,
            extras=payload.extras,
            coupon_obj=coupon_obj,
            car_category=car.category,
            redeem_points=pts_to_redeem,
            point_value_inr=cfg.redemption_value_inr,
            max_point_discount_percent=cfg.max_discount_percent,
            user_points_balance=user_pts,
        )

        if pricing.get("couponError"):
            raise HTTPException(status_code=400, detail=f"Coupon error: {pricing['couponError']}")

        actual_redeemed = pricing.get("pointsRedeemed", 0)
        if actual_redeemed > 0 and user_db:
            if (user_db.reward_points or 0) < actual_redeemed:
                raise HTTPException(status_code=400, detail="Insufficient reward points balance.")
            user_db.reward_points = (user_db.reward_points or 0) - actual_redeemed

        # 6. Instantiate new booking record
        booking = Booking(
            ref=generate_booking_ref(db),
            user_id=user.id if user else None,
            car_id=car.id,
            pickup=payload.pickup.strip(),
            dropoff=payload.dropoff.strip(),
            start_time=payload.start,
            end_time=payload.end,
            customer={
                "fullName": payload.customer.fullName,
                "email": payload.customer.email.lower(),
                "phone": payload.customer.phone,
                "license": payload.customer.license,
            },
            extras=payload.extras,
            pricing=pricing,
            status="Confirmed",
            payment_status="Pending",
            payment_method=None,
        )
        db.add(booking)
        db.flush()

        if actual_redeemed > 0 and user_db:
            tx = RewardTransaction(
                user_id=user_db.id,
                booking_id=booking.id,
                booking_ref=booking.ref,
                transaction_type="redeemed",
                points=-actual_redeemed,
                balance_after=user_db.reward_points,
                description=f"Redeemed {actual_redeemed} points for ₹{pricing.get('pointsDiscount', 0)} discount on booking {booking.ref}",
            )
            db.add(tx)
            notif_pts = Notification(
                user_id=user_db.id,
                title="Points Redeemed",
                message=f"Redeemed {actual_redeemed} points (saved ₹{pricing.get('pointsDiscount', 0)}) on booking {booking.ref}.",
                type="rewards",
            )
            db.add(notif_pts)

        if user:
            notif = Notification(
                user_id=user.id,
                title="Booking Confirmed",
                message=f"Your booking {booking.ref} for {car.brand} {car.model} is confirmed.",
                type="booking",
            )
            db.add(notif)

        # 7. Commit transaction to persist booking and release lock
        db.commit()
        db.refresh(booking)

        # 8. Schedule confirmation, pickup reminder, and return reminder
        try:
            schedule_booking_reminders(db, booking)
        except Exception as rem_err:
            print(f"[Reminder Scheduling Warning] {rem_err}")

        return {"booking": serialize_booking(booking)}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Booking transaction failed: {str(e)}")


@app.post("/api/bookings/{ref}/cancel")
def cancel_booking(ref: str, user: Optional[User] = Depends(get_optional_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.ref == ref).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if user and user.role != "admin" and booking.user_id and booking.user_id != user.id:
        raise HTTPException(status_code=403, detail="You can only cancel your own bookings.")
    if booking.status not in ACTIVE_STATUSES:
        raise HTTPException(status_code=400, detail="Booking is already cancelled or completed.")

    try:
        start_dt = parse_iso_dt(booking.start_time)
        if (start_dt - datetime.now()).total_seconds() < 86400:
            raise HTTPException(status_code=400, detail="Only active bookings starting in 24+ hours can be cancelled.")
    except HTTPException:
        raise
    except Exception:
        pass

    booking.status = "Cancelled"
    booking.cancelled_at = datetime.utcnow()
    if booking.payment_status == "Paid":
        booking.payment_status = "Refunded"

    # Process loyalty point refunds / clawbacks
    refund_booking_rewards(db, booking)

    # Cancel scheduled reminders and schedule cancellation notification
    try:
        cancel_booking_reminders(db, booking)
    except Exception as rem_err:
        print(f"[Reminder Cancellation Warning] {rem_err}")

    if booking.user_id:
        notif = Notification(
            user_id=booking.user_id,
            title="Booking Cancelled",
            message=f"Your booking {booking.ref} has been cancelled successfully.",
            type="cancellation",
        )
        db.add(notif)

    db.commit()
    db.refresh(booking)
    return {"booking": serialize_booking(booking)}



@app.post("/api/bookings/{ref}/payment")
def update_booking_payment(ref: str, payload: PaymentUpdateRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.ref == ref).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.status == "Cancelled":
        raise HTTPException(status_code=400, detail="Cannot pay for a cancelled booking.")

    booking.payment_method = payload.paymentMethod
    booking.payment_status = payload.paymentStatus

    if booking.status == "Completed" and payload.paymentStatus == "Paid":
        award_booking_rewards(db, booking)

    db.commit()
    db.refresh(booking)
    return {"booking": serialize_booking(booking)}


# --- Contact Messages ---
@app.post("/api/contact", status_code=status.HTTP_201_CREATED)
def submit_contact(payload: ContactCreateRequest, db: Session = Depends(get_db)):
    msg = ContactMessage(
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        phone=(payload.phone or "").strip(),
        subject=payload.subject.strip(),
        message=payload.message.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"ok": True, "id": msg.id, "message": "Your message has been received. Our team will respond shortly."}


@app.get("/api/contact")
def list_contacts(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    msgs = db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()
    return {
        "messages": [
            {
                "id": m.id,
                "name": m.name,
                "email": m.email,
                "phone": m.phone,
                "subject": m.subject,
                "message": m.message,
                "createdAt": m.created_at.isoformat() if m.created_at else None,
            }
            for m in msgs
        ]
    }


# --- Coupons Validation ---
@app.post("/api/coupons/validate")
def validate_coupon_endpoint(payload: CouponValidateRequest, db: Session = Depends(get_db)):
    car = db.query(Car).filter(Car.id == payload.carId).first()
    if not car:
        raise HTTPException(status_code=404, detail="Selected car does not exist.")

    code = payload.code.strip().upper()
    coupon = db.query(Coupon).filter(Coupon.code == code).first()
    if not coupon:
        raise HTTPException(status_code=400, detail="Invalid coupon code.")
    if not coupon.active:
        raise HTTPException(status_code=400, detail="This coupon code is no longer active.")

    try:
        pricing = calculate_server_pricing(
            price_per_day=car.price_per_day,
            deposit=car.deposit,
            start_str=payload.start,
            end_str=payload.end,
            extras=payload.extras or {},
            coupon_obj=coupon,
            car_category=car.category,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if pricing.get("couponError"):
        raise HTTPException(status_code=400, detail=pricing["couponError"])

    return {
        "ok": True,
        "code": coupon.code,
        "description": coupon.description,
        "discount": pricing["discount"],
        "pricing": pricing,
    }


# --- Smart Rental Price Calculator API ---
@app.post("/api/pricing/calculate")
def calculate_price_endpoint(
    payload: PriceCalculateRequest,
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    car = db.query(Car).filter(Car.id == payload.carId).first()
    if not car:
        raise HTTPException(status_code=404, detail="Selected car does not exist.")

    coupon_obj = None
    if payload.couponCode and payload.couponCode.strip():
        code = payload.couponCode.strip().upper()
        coupon_obj = db.query(Coupon).filter(Coupon.code == code).first()
        if not coupon_obj:
            raise HTTPException(status_code=400, detail=f"Invalid coupon code '{code}'.")
        if not coupon_obj.active:
            raise HTTPException(status_code=400, detail=f"Coupon code '{code}' is inactive.")

    cfg = get_loyalty_config(db)
    user_pts = (user.reward_points or 0) if user else 0
    pts_to_redeem = payload.redeemPoints or 0
    if not cfg.is_active or user_pts < cfg.min_points_to_redeem:
        pts_to_redeem = 0

    try:
        pricing = calculate_server_pricing(
            price_per_day=car.price_per_day,
            deposit=car.deposit,
            start_str=payload.start,
            end_str=payload.end,
            extras=payload.extras or {},
            coupon_obj=coupon_obj,
            car_category=car.category,
            redeem_points=pts_to_redeem,
            point_value_inr=cfg.redemption_value_inr,
            max_point_discount_percent=cfg.max_discount_percent,
            user_points_balance=user_pts,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if pricing.get("couponError"):
        raise HTTPException(status_code=400, detail=pricing["couponError"])

    return {
        "ok": True,
        "carId": car.id,
        "carName": f"{car.brand} {car.model}",
        "pricing": pricing,
    }


# --- Booking Receipt / Invoice ---
@app.get("/api/bookings/{ref}/receipt")
def get_booking_receipt(ref: str, user: Optional[User] = Depends(get_optional_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.ref == ref).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    is_authorized = bool(
        (user and user.role == "admin") or
        (user and booking.user_id == user.id) or
        (user and isinstance(booking.customer, dict) and booking.customer.get("email", "").lower() == user.email.lower()) or
        (not booking.user_id) # newly created guest booking
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Access denied. You can only view receipts for your own bookings.")

    car = booking.car
    pricing = booking.pricing if isinstance(booking.pricing, dict) else {}
    receipt_data = {
        "invoiceNumber": f"INV-{booking.ref}",
        "bookingRef": booking.ref,
        "invoiceDate": booking.created_at.strftime("%d %b %Y") if booking.created_at else "",
        "status": booking.status,
        "paymentStatus": booking.payment_status,
        "paymentMethod": booking.payment_method or "Credit / Debit Card (Demo)",
        "customer": {
            "name": booking.customer.get("fullName", "Valued Customer"),
            "email": booking.customer.get("email", ""),
            "phone": booking.customer.get("phone", ""),
            "license": booking.customer.get("license", ""),
        },
        "vehicle": {
            "id": booking.car_id,
            "name": f"{car.brand} {car.model}" if car else "Vehicle",
            "category": car.category if car else "",
            "transmission": car.transmission if car else "",
            "fuel": car.fuel if car else "",
            "seats": car.seats if car else 5,
            "ratePerDay": car.price_per_day if car else 0,
            "image": car.image if car else "",
        },
        "schedule": {
            "pickupLocation": booking.pickup,
            "dropoffLocation": booking.dropoff,
            "startTime": booking.start_time,
            "endTime": booking.end_time,
            "days": pricing.get("days", 1),
        },
        "charges": {
            "baseRental": pricing.get("base", 0),
            "extras": pricing.get("extras", 0),
            "discount": pricing.get("discount", 0),
            "gst": pricing.get("tax", 0),
            "securityDeposit": pricing.get("deposit", 0),
            "totalAmount": pricing.get("total", 0),
        },
        "company": {
            "name": "Drivo Car Rental Private Limited",
            "taxId": "GSTIN33AAACD9999Z1Z",
            "supportEmail": "support@drivo.example",
            "supportPhone": "+91 98765 43210",
            "address": "RS Puram, Coimbatore, Tamil Nadu, 641002",
        },
    }
    return {"receipt": receipt_data}


@app.get("/api/bookings/{ref}/invoice.pdf")
@app.get("/api/bookings/{ref}/receipt.pdf")
def download_booking_invoice_pdf(
    ref: str,
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.ref == ref).first()
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking with reference '{ref}' not found.")

    is_authorized = bool(
        (user and user.role == "admin") or
        (user and booking.user_id == user.id) or
        (user and isinstance(booking.customer, dict) and booking.customer.get("email", "").lower() == user.email.lower()) or
        (not booking.user_id) # newly created guest booking
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Access denied. You can only download invoices for your own bookings.")

    try:
        car = booking.car
        pricing = booking.pricing if isinstance(booking.pricing, dict) else {}
        pdf_bytes = generate_invoice_pdf(booking, car, pricing)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate invoice PDF: {str(e)}")

    filename = f"Drivo-Invoice-{booking.ref}.pdf"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Content-Type": "application/pdf",
        "Cache-Control": "no-cache, no-store, must-revalidate",
    }
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)


# --- Customer Endpoints ---
@app.get("/api/notifications")
def get_user_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )
    return {"notifications": [serialize_notification(n) for n in notifs]}


@app.patch("/api/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notif.read = True
    db.commit()
    return {"ok": True}


@app.post("/api/notifications/read-all")
def mark_all_notifications_read(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == user.id, Notification.read == False).update({"read": True})
    db.commit()
    return {"ok": True, "message": "All notifications marked as read."}


@app.get("/api/notifications/email-config")
def get_email_config_endpoint():
    """Returns SMTP credential readiness status and configuration guidelines."""
    return {"ok": True, "config": get_email_config_status()}


@app.get("/api/user/notification-preferences")
def get_user_notification_preferences(user: User = Depends(get_current_user)):
    return {
        "ok": True,
        "preferences": {
            "emailNotifsEnabled": bool(getattr(user, "email_notifs_enabled", True)),
            "pickupRemindersEnabled": bool(getattr(user, "pickup_reminders_enabled", True)),
            "returnRemindersEnabled": bool(getattr(user, "return_reminders_enabled", True)),
        },
    }


@app.patch("/api/user/notification-preferences")
def update_user_notification_preferences(
    payload: NotificationPreferencesUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    u = db.query(User).filter(User.id == user.id).first()
    u.email_notifs_enabled = payload.emailNotifsEnabled
    u.pickup_reminders_enabled = payload.pickupRemindersEnabled
    u.return_reminders_enabled = payload.returnRemindersEnabled
    db.commit()
    db.refresh(u)
    return {
        "ok": True,
        "message": "Notification preferences updated successfully.",
        "preferences": {
            "emailNotifsEnabled": bool(u.email_notifs_enabled),
            "pickupRemindersEnabled": bool(u.pickup_reminders_enabled),
            "returnRemindersEnabled": bool(u.return_reminders_enabled),
        },
    }


@app.get("/api/admin/reminders")
def list_admin_reminders(
    status: Optional[str] = None,
    type: Optional[str] = None,
    search: Optional[str] = None,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Admin inspection of all scheduled, sent, and failed reminder jobs."""
    query = db.query(BookingReminder)
    if status and status != "all":
        query = query.filter(BookingReminder.status == status)
    if type and type != "all":
        query = query.filter(BookingReminder.reminder_type == type)
    if search and search.strip():
        q = f"%{search.strip().lower()}%"
        query = query.filter(
            (BookingReminder.booking_ref.ilike(q)) |
            (BookingReminder.recipient_email.ilike(q)) |
            (BookingReminder.recipient_name.ilike(q)) |
            (BookingReminder.subject.ilike(q))
        )
    reminders = query.order_by(BookingReminder.scheduled_for.desc()).limit(150).all()

    all_reminders = db.query(BookingReminder).all()
    pending_count = sum(1 for r in all_reminders if r.status == "pending")
    sent_count = sum(1 for r in all_reminders if r.status in ("sent", "simulated"))
    failed_count = sum(1 for r in all_reminders if r.status == "failed")
    cancelled_count = sum(1 for r in all_reminders if r.status == "cancelled")

    return {
        "ok": True,
        "stats": {
            "total": len(all_reminders),
            "pending": pending_count,
            "sent": sent_count,
            "failed": failed_count,
            "cancelled": cancelled_count,
        },
        "emailConfig": get_email_config_status(),
        "reminders": [serialize_reminder(r) for r in reminders],
    }


@app.post("/api/admin/reminders/process")
def process_reminders_manual(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Manually triggers batch execution of due reminders."""
    result = process_due_reminders(db, limit=50)
    return {"ok": True, "result": result}


# --- Verified Reviews ---
@app.get("/api/cars/{car_id}/reviews")
def list_car_reviews(car_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.car_id == car_id).order_by(Review.created_at.desc()).all()
    return {"reviews": [serialize_review(r) for r in reviews]}


@app.post("/api/reviews", status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.ref == payload.bookingRef.strip()).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.user_id != user.id and booking.customer.get("email", "").lower() != user.email.lower():
        raise HTTPException(status_code=403, detail="You can only review your own trips.")
    if booking.status != "Completed":
        raise HTTPException(status_code=400, detail="Reviews can only be submitted for completed trips.")

    existing = db.query(Review).filter(Review.booking_id == booking.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted a review for this booking.")

    review = Review(
        user_id=user.id,
        car_id=booking.car_id,
        booking_id=booking.id,
        rating=payload.rating,
        title=payload.title.strip() if payload.title else "",
        comment=payload.comment.strip(),
    )
    db.add(review)

    # Recalculate car rating based on verified reviews
    car = db.query(Car).filter(Car.id == booking.car_id).first()
    if car:
        all_car_reviews = db.query(Review).filter(Review.car_id == car.id).all()
        total_ratings = sum(r.rating for r in all_car_reviews) + payload.rating
        count = len(all_car_reviews) + 1
        car.rating = round(total_ratings / count, 1)

    db.commit()
    db.refresh(review)
    return {"review": serialize_review(review)}


# --- Admin Dashboard & Fleet Management ---
@app.get("/api/admin/stats")
def get_admin_stats(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    total_cars = db.query(Car).count()
    available_cars = db.query(Car).filter(Car.available == True).count()
    total_bookings = db.query(Booking).count()
    active_bookings = db.query(Booking).filter(Booking.status == "Confirmed").count()
    completed_bookings = db.query(Booking).filter(Booking.status == "Completed").count()
    cancelled_bookings = db.query(Booking).filter(Booking.status == "Cancelled").count()
    pending_bookings = db.query(Booking).filter(
        Booking.payment_status == "Pending",
        Booking.status != "Cancelled"
    ).count()
    total_users = db.query(User).count()

    all_bookings = db.query(Booking).all()
    revenue_total = 0
    paid_revenue = 0
    for b in all_bookings:
        if b.status in ("Confirmed", "Completed"):
            total_amt = b.pricing.get("total", 0) if isinstance(b.pricing, dict) else 0
            revenue_total += total_amt
            if b.payment_status == "Paid":
                paid_revenue += total_amt

    return {
        "totalCars": total_cars,
        "availableCars": available_cars,
        "totalBookings": total_bookings,
        "activeBookings": active_bookings,
        "confirmedBookings": active_bookings,
        "completedBookings": completed_bookings,
        "cancelledBookings": cancelled_bookings,
        "pendingBookings": pending_bookings,
        "totalUsers": total_users,
        "totalRevenue": revenue_total,
        "grossBookingValue": revenue_total,
        "paidRevenue": paid_revenue,
        "collectedRevenue": paid_revenue,
        "pendingRevenue": max(0, revenue_total - paid_revenue),
    }


@app.get("/api/admin/analytics")
def get_admin_analytics(
    range_type: str = Query("all", alias="range"),
    start_date: Optional[str] = Query(None, alias="startDate"),
    end_date: Optional[str] = Query(None, alias="endDate"),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    filter_start = None
    filter_end = None

    if range_type == "30d":
        filter_start = now - timedelta(days=30)
    elif range_type == "90d":
        filter_start = now - timedelta(days=90)
    elif range_type == "year":
        filter_start = datetime(now.year, 1, 1)
    elif range_type == "custom" and start_date:
        try:
            filter_start = datetime.fromisoformat(start_date.replace("Z", "+00:00")).replace(tzinfo=None)
            if end_date:
                filter_end = datetime.fromisoformat(end_date.replace("Z", "+00:00")).replace(tzinfo=None)
        except Exception:
            pass

    # Fleet metrics
    all_cars = db.query(Car).all()
    total_cars = len(all_cars)
    available_cars = sum(1 for c in all_cars if c.available)
    maintenance_cars = total_cars - available_cars

    # Check which cars are on an active trip right now
    now_iso = now.strftime("%Y-%m-%dT%H:%M")
    active_now_bookings = db.query(Booking).filter(
        Booking.status.in_(["Confirmed", "Completed"]),
        Booking.start_time <= now_iso,
        Booking.end_time >= now_iso,
    ).all()
    booked_car_ids = set(b.car_id for b in active_now_bookings)
    booked_now_count = len(booked_car_ids)
    utilization_rate = round((booked_now_count / total_cars * 100), 1) if total_cars > 0 else 0.0

    # User metrics
    total_users = db.query(User).count()
    customer_users = db.query(User).filter(User.role == "customer").count()
    admin_users = db.query(User).filter(User.role == "admin").count()

    # Query all bookings
    all_bookings = db.query(Booking).order_by(Booking.created_at.desc()).all()

    # Filter bookings by date range
    period_bookings = []
    for b in all_bookings:
        if not b.created_at:
            period_bookings.append(b)
            continue
        if filter_start and b.created_at < filter_start:
            continue
        if filter_end and b.created_at > filter_end:
            continue
        period_bookings.append(b)

    # Booking counts for selected period
    total_bookings = len(period_bookings)
    confirmed_bookings = sum(1 for b in period_bookings if b.status == "Confirmed")
    completed_bookings = sum(1 for b in period_bookings if b.status == "Completed")
    cancelled_bookings = sum(1 for b in period_bookings if b.status == "Cancelled")
    pending_bookings = sum(
        1 for b in period_bookings
        if (b.payment_status == "Pending" or b.status == "Pending") and b.status != "Cancelled"
    )

    # Revenue metrics
    gross_booking_value = 0      # Non-cancelled committed bookings value
    collected_revenue = 0        # Verified paid revenue
    pending_revenue = 0          # Awaiting payment
    refunded_revenue = 0         # Refunded for cancellations
    total_pipeline_value = 0     # All bookings including pending/cancelled

    for b in period_bookings:
        amt = b.pricing.get("total", 0) if isinstance(b.pricing, dict) else 0
        total_pipeline_value += amt

        if b.status in ("Confirmed", "Completed"):
            gross_booking_value += amt
            if b.payment_status == "Paid":
                collected_revenue += amt
            elif b.payment_status in ("Pending", "Unpaid"):
                pending_revenue += amt

        if b.status == "Cancelled" and b.payment_status == "Refunded":
            refunded_revenue += amt

    valid_bookings = confirmed_bookings + completed_bookings
    avg_order_value = round(gross_booking_value / valid_bookings, 2) if valid_bookings > 0 else 0

    # Monthly Trends (last 6 months or full current year)
    monthly_map = {}
    for b in all_bookings:
        if not b.created_at:
            continue
        m_key = b.created_at.strftime("%Y-%m")
        label = b.created_at.strftime("%b %Y")
        if m_key not in monthly_map:
            monthly_map[m_key] = {
                "month": m_key,
                "label": label,
                "bookings": 0,
                "grossValue": 0,
                "collectedRevenue": 0,
                "cancelled": 0,
            }
        monthly_map[m_key]["bookings"] += 1
        amt = b.pricing.get("total", 0) if isinstance(b.pricing, dict) else 0
        if b.status in ("Confirmed", "Completed"):
            monthly_map[m_key]["grossValue"] += amt
            if b.payment_status == "Paid":
                monthly_map[m_key]["collectedRevenue"] += amt
        elif b.status == "Cancelled":
            monthly_map[m_key]["cancelled"] += 1

    # Ensure at least last 6 calendar months are represented
    for i in range(5, -1, -1):
        d = now - timedelta(days=i * 30)
        m_key = d.strftime("%Y-%m")
        if m_key not in monthly_map:
            monthly_map[m_key] = {
                "month": m_key,
                "label": d.strftime("%b %Y"),
                "bookings": 0,
                "grossValue": 0,
                "collectedRevenue": 0,
                "cancelled": 0,
            }

    sorted_trends = [monthly_map[k] for k in sorted(monthly_map.keys())][-12:]

    # Popular Cars based on actual bookings
    car_booking_counts = {}
    car_revenue_map = {}
    for b in all_bookings:
        cid = b.car_id
        car_booking_counts[cid] = car_booking_counts.get(cid, 0) + 1
        amt = b.pricing.get("total", 0) if isinstance(b.pricing, dict) else 0
        if b.status in ("Confirmed", "Completed"):
            car_revenue_map[cid] = car_revenue_map.get(cid, 0) + amt

    popular_cars = []
    cars_by_id = {c.id: c for c in all_cars}
    sorted_car_ids = sorted(car_booking_counts.keys(), key=lambda x: car_booking_counts[x], reverse=True)
    all_time_bookings_count = len(all_bookings)

    for cid in sorted_car_ids[:6]:
        car = cars_by_id.get(cid)
        if car:
            b_count = car_booking_counts[cid]
            share = round((b_count / all_time_bookings_count * 100), 1) if all_time_bookings_count > 0 else 0
            popular_cars.append({
                "id": car.id,
                "brand": car.brand,
                "model": car.model,
                "category": car.category,
                "image": car.image,
                "pricePerDay": car.price_per_day,
                "bookingsCount": b_count,
                "revenue": car_revenue_map.get(cid, 0),
                "sharePercent": share,
            })

    # Inventory & Availability by Category
    categories_dict = {}
    for c in all_cars:
        cat = c.category
        if cat not in categories_dict:
            categories_dict[cat] = {
                "category": cat,
                "total": 0,
                "available": 0,
                "maintenance": 0,
                "bookedNow": 0,
            }
        categories_dict[cat]["total"] += 1
        if c.available:
            categories_dict[cat]["available"] += 1
        else:
            categories_dict[cat]["maintenance"] += 1
        if c.id in booked_car_ids:
            categories_dict[cat]["bookedNow"] += 1

    category_summary = []
    for cat, info in sorted(categories_dict.items()):
        info["sharePercent"] = round((info["total"] / total_cars * 100), 1) if total_cars else 0
        category_summary.append(info)

    # Recent bookings (latest 10)
    recent = [serialize_booking(b) for b in all_bookings[:10]]

    return {
        "kpis": {
            "totalCars": total_cars,
            "availableCars": available_cars,
            "maintenanceCars": maintenance_cars,
            "currentlyBookedCars": booked_now_count,
            "fleetUtilizationRate": utilization_rate,
            "totalUsers": total_users,
            "customerUsers": customer_users,
            "adminUsers": admin_users,
            "totalBookings": total_bookings,
            "pendingBookings": pending_bookings,
            "confirmedBookings": confirmed_bookings,
            "completedBookings": completed_bookings,
            "cancelledBookings": cancelled_bookings,
            "grossBookingValue": gross_booking_value,
            "collectedRevenue": collected_revenue,
            "pendingRevenue": pending_revenue,
            "refundedRevenue": refunded_revenue,
            "totalPipelineValue": total_pipeline_value,
            "avgOrderValue": avg_order_value,
        },
        "monthlyTrends": sorted_trends,
        "popularCars": popular_cars,
        "categorySummary": category_summary,
        "recentBookings": recent,
        "filter": {
            "range": range_type,
            "startDate": filter_start.isoformat() if filter_start else None,
            "endDate": filter_end.isoformat() if filter_end else None,
        },
    }


@app.get("/api/admin/bookings")
def list_admin_bookings(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).all()
    return {"bookings": [serialize_booking(b) for b in bookings]}


@app.patch("/api/admin/bookings/{booking_id}/status")
def update_booking_status_admin(
    booking_id: int,
    payload: BookingStatusUpdateRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    old_status = booking.status
    booking.status = payload.status
    if payload.paymentStatus:
        booking.payment_status = payload.paymentStatus
    if payload.status == "Cancelled":
        booking.cancelled_at = datetime.utcnow()
        if booking.payment_status == "Paid":
            booking.payment_status = "Refunded"
        refund_booking_rewards(db, booking)
        try:
            cancel_booking_reminders(db, booking)
        except Exception:
            pass
    elif payload.status == "Completed" and booking.payment_status == "Paid":
        award_booking_rewards(db, booking)

    if booking.user_id:
        car_name = f"{booking.car.brand} {booking.car.model}" if booking.car else "Vehicle"
        notif = Notification(
            user_id=booking.user_id,
            title=f"Booking Status: {payload.status}",
            message=f"Your booking {booking.ref} for {car_name} status was updated from {old_status} to {payload.status}.",
            type="booking" if payload.status != "Cancelled" else "cancellation",
        )
        db.add(notif)

    db.commit()
    db.refresh(booking)
    return {"booking": serialize_booking(booking)}


# ==========================================================
# --- Loyalty and Rewards Points System Endpoints ---
# ==========================================================

@app.get("/api/loyalty/config")
def get_loyalty_config_endpoint(db: Session = Depends(get_db)):
    """Retrieve current loyalty program configuration and tier rules."""
    cfg = get_loyalty_config(db)
    return {"ok": True, "config": serialize_loyalty_config(cfg)}


@app.put("/api/admin/loyalty/config")
def update_loyalty_config_endpoint(
    payload: LoyaltyConfigUpdateRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Admin updates points earning rules, redemption values, and tier thresholds."""
    cfg = get_loyalty_config(db)
    cfg.points_per_100_inr = payload.pointsPer100Inr
    cfg.redemption_value_inr = payload.redemptionValueInr
    cfg.min_points_to_redeem = payload.minPointsToRedeem
    cfg.max_discount_percent = payload.maxDiscountPercent
    cfg.silver_threshold = payload.silverThreshold
    cfg.gold_threshold = payload.goldThreshold
    cfg.platinum_threshold = payload.platinumThreshold
    cfg.gold_multiplier = payload.goldMultiplier
    cfg.platinum_multiplier = payload.platinumMultiplier
    cfg.is_active = payload.isActive

    db.commit()
    db.refresh(cfg)
    return {
        "ok": True,
        "message": "Loyalty program settings updated successfully.",
        "config": serialize_loyalty_config(cfg),
    }


@app.get("/api/loyalty/my")
def get_my_loyalty_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns authenticated customer's available points, lifetime points, tier, and transaction history."""
    cfg = get_loyalty_config(db)
    # Refresh user to get authoritative balance
    curr_user = db.query(User).filter(User.id == user.id).first()
    reward_pts = getattr(curr_user, "reward_points", 0) or 0
    lifetime_pts = getattr(curr_user, "lifetime_points", 0) or 0
    tier = getattr(curr_user, "tier", "Silver") or "Silver"

    # Ensure tier matches current lifetime points & config
    calculated_tier = calculate_user_tier(lifetime_pts, cfg)
    if tier != calculated_tier:
        curr_user.tier = calculated_tier
        db.commit()
        tier = calculated_tier

    multiplier = get_tier_multiplier(tier, cfg)

    # Next tier calculation
    next_tier = None
    points_needed = 0
    progress_percent = 100
    if tier == "Silver":
        next_tier = "Gold"
        target = cfg.gold_threshold
        points_needed = max(0, target - lifetime_pts)
        progress_percent = min(100, round((lifetime_pts / target * 100))) if target > 0 else 100
    elif tier == "Gold":
        next_tier = "Platinum"
        target = cfg.platinum_threshold
        points_needed = max(0, target - lifetime_pts)
        span = target - cfg.gold_threshold
        if span > 0:
            current_progress = lifetime_pts - cfg.gold_threshold
            progress_percent = min(100, max(0, round((current_progress / span) * 100)))
        else:
            progress_percent = 100
    else:
        next_tier = "Max Tier (Platinum Elite)"
        points_needed = 0
        progress_percent = 100

    txs = (
        db.query(RewardTransaction)
        .filter(RewardTransaction.user_id == user.id)
        .order_by(RewardTransaction.created_at.desc())
        .limit(50)
        .all()
    )

    # Total points redeemed
    total_redeemed = sum(
        abs(t.points)
        for t in txs
        if t.transaction_type == "redeemed"
    )

    return {
        "ok": True,
        "rewardPoints": reward_pts,
        "lifetimePoints": lifetime_pts,
        "tier": tier,
        "tierMultiplier": multiplier,
        "equivalentValueInr": round(reward_pts * cfg.redemption_value_inr, 2),
        "totalRedeemedPoints": total_redeemed,
        "nextTier": {
            "name": next_tier,
            "pointsNeeded": points_needed,
            "progressPercent": progress_percent,
        },
        "config": serialize_loyalty_config(cfg),
        "transactions": [serialize_reward_transaction(t) for t in txs],
    }


@app.get("/api/admin/loyalty/transactions")
def list_admin_loyalty_transactions(
    search: Optional[str] = None,
    type: Optional[str] = None,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Admin view of all customer reward transactions and aggregate statistics."""
    cfg = get_loyalty_config(db)
    query = db.query(RewardTransaction).join(User, RewardTransaction.user_id == User.id)

    if type and type != "all":
        query = query.filter(RewardTransaction.transaction_type == type)

    if search and search.strip():
        q = f"%{search.strip().lower()}%"
        query = query.filter(
            (User.email.ilike(q)) |
            (User.full_name.ilike(q)) |
            (RewardTransaction.booking_ref.ilike(q)) |
            (RewardTransaction.description.ilike(q))
        )

    all_txs = query.order_by(RewardTransaction.created_at.desc()).limit(200).all()

    # Aggregates across entire system
    all_users = db.query(User).all()
    total_issued = sum(u.lifetime_points or 0 for u in all_users)
    total_balance = sum(u.reward_points or 0 for u in all_users)
    silver_count = sum(1 for u in all_users if getattr(u, "tier", "Silver") == "Silver")
    gold_count = sum(1 for u in all_users if getattr(u, "tier", "Silver") == "Gold")
    platinum_count = sum(1 for u in all_users if getattr(u, "tier", "Silver") == "Platinum")

    serialized_txs = []
    for t in all_txs:
        item = serialize_reward_transaction(t)
        item["customerName"] = t.user.full_name if t.user else "Customer"
        item["customerEmail"] = t.user.email if t.user else ""
        item["customerTier"] = t.user.tier if t.user else "Silver"
        serialized_txs.append(item)

    return {
        "ok": True,
        "config": serialize_loyalty_config(cfg),
        "stats": {
            "totalPointsIssued": total_issued,
            "activePointsOutstanding": total_balance,
            "activePointsValueInr": round(total_balance * cfg.redemption_value_inr, 2),
            "tierCounts": {
                "Silver": silver_count,
                "Gold": gold_count,
                "Platinum": platinum_count,
            },
        },
        "transactions": serialized_txs,
    }


@app.post("/api/admin/loyalty/adjust")
def admin_adjust_user_points(
    payload: AdminPointsAdjustmentRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Admin manual points credit or debit with concurrency lock and ledger reason."""
    cfg = get_loyalty_config(db)
    user = db.query(User).filter(User.id == payload.userId).with_for_update().first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer account not found.")

    curr_pts = user.reward_points or 0
    if payload.points < 0 and (curr_pts + payload.points) < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot deduct {abs(payload.points)} points. Customer only has {curr_pts} points available.",
        )

    user.reward_points = curr_pts + payload.points
    if payload.points > 0:
        user.lifetime_points = (user.lifetime_points or 0) + payload.points
    user.tier = calculate_user_tier(user.lifetime_points, cfg)

    tx_type = "adjustment"
    tx = RewardTransaction(
        user_id=user.id,
        transaction_type=tx_type,
        points=payload.points,
        balance_after=user.reward_points,
        description=f"Admin adjustment by {admin.full_name}: {payload.reason.strip()}",
    )
    db.add(tx)

    action_word = "credited to" if payload.points >= 0 else "deducted from"
    notif = Notification(
        user_id=user.id,
        title="Points Balance Adjusted",
        message=f"{abs(payload.points)} points were {action_word} your account. Reason: {payload.reason}. New balance: {user.reward_points} pts.",
        type="rewards",
    )
    db.add(notif)

    db.commit()
    db.refresh(user)

    return {
        "ok": True,
        "message": f"Successfully updated {user.full_name}'s points balance to {user.reward_points} pts.",
        "user": serialize_user(user),
    }


# ==========================================================
# --- Wedding Car Decoration Booking Endpoints ---
# ==========================================================

WEDDING_ADDONS_PRICING = {
    "Personalized Groom & Bride Name Plate": 400,
    "Interior Rose Petal Aroma Spread": 300,
    "Standby Touch-Up Florist at Hall": 800,
    "Grand Rear Parcel Shelf Flower Display": 600,
    "Exotic Imported Lily Upgrade": 1000,
    "Red Carpet Car Entry Walkway": 700,
}


def classify_wedding_category(car: Car) -> str:
    brand = car.brand.lower()
    model = car.model.lower()
    cat = car.category.lower()

    if any(b in brand for b in ["mercedes", "bmw", "audi", "porsche", "range rover", "lexus", "volvo"]) or "luxury" in cat:
        return "Luxury"
    elif any(b in model for b in ["swift", "i20", "dzire", "wagon", "tiago", "baleno", "celerio", "altroz", "amaze", "aura", "tigor", "ignis", "glanza", "kwid"]) or "hatchback" in cat:
        return "Budget"
    elif any(b in model for b in ["creta", "seltos", "innova", "xuv700", "city", "verna", "slavia", "virtus", "scorpio", "harrier", "safari", "hector", "hycross", "carens", "compass", "camry"]):
        return "Premium"
    elif "suv" in cat or "sedan" in cat or "muv" in cat or "mpv" in cat:
        return "Premium"
    return "Eligible Fleet"


def calculate_wedding_pricing(
    package: DecorationPackage,
    car: Optional[Car] = None,
    drive_mode: str = "with_driver",
    expected_duration_hours: int = 8,
    expected_distance_km: int = 100,
    additional_addons: Optional[List[str]] = None,
    service_city: str = "Nagercoil",
    venue_location: str = "",
    driver_cfg: Optional[DriverPricingConfig] = None,
) -> dict:
    decor_price = max(0, int(package.starting_price))

    # 1. Car rental charge & deposit
    if drive_mode == "decor_only" or not car:
        car_rental_charge = 0
        deposit = 0
    elif drive_mode == "self_drive":
        car_rental_charge = max(0, int(car.price_per_day))
        deposit = max(0, int(car.deposit))
    else:  # "with_driver"
        car_rental_charge = max(0, int(car.price_per_day))
        deposit = 0  # Chauffeur driven - zero damage deposit for customer!

    # 2. Driver charge breakdown
    driver_base_charge = 0
    extra_hours_charge = 0
    extra_distance_charge = 0
    driver_total_charge = 0
    extra_hours = 0
    extra_km = 0

    if drive_mode == "with_driver" and car:
        base_fee = driver_cfg.base_driver_fee if driver_cfg else 1000
        inc_hrs = driver_cfg.included_hours if driver_cfg else 8
        inc_km = driver_cfg.included_km if driver_cfg else 100
        ot_rate = driver_cfg.overtime_rate_per_hour if driver_cfg else 200
        km_rate = driver_cfg.extra_km_rate if driver_cfg else 20

        driver_base_charge = base_fee
        extra_hours = max(0, int(expected_duration_hours or 8) - inc_hrs)
        extra_km = max(0, int(expected_distance_km or 100) - inc_km)
        extra_hours_charge = extra_hours * ot_rate
        extra_distance_charge = extra_km * km_rate
        driver_total_charge = driver_base_charge + extra_hours_charge + extra_distance_charge

    # 3. Add-ons
    addons_total = 0
    addons_breakdown = []
    if additional_addons:
        for item in additional_addons:
            price = WEDDING_ADDONS_PRICING.get(item, 500)
            addons_total += price
            addons_breakdown.append({"item": item, "price": price})

    # 4. Delivery / Travel fee (free within Nagercoil & Kanyakumari district, 350 for outer districts)
    norm_city = (service_city or "").lower()
    norm_loc = (venue_location or "").lower()
    travel_fee = 0
    if not any(k in norm_city or k in norm_loc for k in ["nagercoil", "kanyakumari", "thuckalay", "marthandam", "colachel", "kanniyakumari"]):
        travel_fee = 350

    taxable = decor_price + car_rental_charge + driver_total_charge + addons_total + travel_fee
    gst = round(taxable * 0.18)
    discount = 0
    total = taxable + gst

    return {
        "decorPackagePrice": decor_price,
        "carRentalCharge": car_rental_charge,
        "driveMode": drive_mode,
        "driverBaseCharge": driver_base_charge,
        "extraHours": extra_hours,
        "extraHoursCharge": extra_hours_charge,
        "extraDistanceKm": extra_km,
        "extraDistanceCharge": extra_distance_charge,
        "driverTotalCharge": driver_total_charge,
        "addonsTotal": addons_total,
        "addonsBreakdown": addons_breakdown,
        "travelDeliveryFee": travel_fee,
        "taxable": taxable,
        "gstRate": 0.18,
        "gst": gst,
        "deposit": deposit,
        "discount": discount,
        "total": total,
    }


@app.get("/api/decorations/packages")
def list_active_decoration_packages(db: Session = Depends(get_db)):
    """Public endpoint to fetch active wedding decoration packages."""
    pkgs = (
        db.query(DecorationPackage)
        .filter(DecorationPackage.is_active == True)
        .order_by(DecorationPackage.sort_order.asc(), DecorationPackage.starting_price.asc())
        .all()
    )
    return {
        "ok": True,
        "serviceArea": "Nagercoil, Kanyakumari & Surrounding Districts",
        "packages": [serialize_decoration_package(p) for p in pkgs],
        "availableAddons": WEDDING_ADDONS_PRICING,
    }


@app.get("/api/decorations/packages/{id_or_slug}")
def get_decoration_package(id_or_slug: str, db: Session = Depends(get_db)):
    """Fetch a single decoration package by ID or URL slug."""
    pkg = None
    if id_or_slug.isdigit():
        pkg = db.query(DecorationPackage).filter(DecorationPackage.id == int(id_or_slug)).first()
    if not pkg:
        pkg = db.query(DecorationPackage).filter(DecorationPackage.slug == id_or_slug).first()

    if not pkg:
        raise HTTPException(status_code=404, detail="Decoration package not found.")
    return {"ok": True, "package": serialize_decoration_package(pkg)}


@app.get("/api/decorations/cars")
def list_wedding_cars(
    date: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Returns actual wedding-suitable vehicle catalogue from MySQL database with date availability."""
    query = db.query(Car).filter(Car.available == True)
    all_cars = query.order_by(Car.popularity.desc(), Car.price_per_day.asc()).all()

    # Pre-fetch booked car IDs on the selected date if date is provided
    booked_car_ids = set()
    if date and date.strip():
        date_str = date.strip()
        # Confirmed in wedding decoration bookings
        w_booked = (
            db.query(WeddingDecorationBooking.car_id)
            .filter(
                WeddingDecorationBooking.event_date == date_str,
                WeddingDecorationBooking.status.in_(["Confirmed", "In Progress"]),
                WeddingDecorationBooking.car_id != None,
            )
            .all()
        )
        for (cid,) in w_booked:
            if cid:
                booked_car_ids.add(cid)

        # Overlapping regular bookings
        r_booked = (
            db.query(Booking.car_id)
            .filter(
                Booking.status == "Confirmed",
                Booking.start_time <= f"{date_str}T23:59:59",
                Booking.end_time >= f"{date_str}T00:00:00",
            )
            .all()
        )
        for (cid,) in r_booked:
            if cid:
                booked_car_ids.add(cid)

    catalogue = []
    for c in all_cars:
        wed_cat = classify_wedding_category(c)
        if category and category.lower() != "all" and wed_cat.lower() != category.lower():
            continue

        is_avail = c.id not in booked_car_ids

        images_list = c.images if isinstance(c.images, list) else ([c.image] if c.image else [])

        catalogue.append({
            "id": c.id,
            "brand": c.brand,
            "model": c.model,
            "year": c.year,
            "category": c.category,
            "weddingCategory": wed_cat,  # Budget, Premium, Luxury, Eligible Fleet
            "fuel": c.fuel,
            "transmission": c.transmission,
            "seats": c.seats,
            "pricePerDay": c.price_per_day,
            "deposit": c.deposit,
            "rating": c.rating,
            "location": c.location,
            "image": c.image,
            "images": images_list,
            "description": c.description,
            "weddingDecorationCompatible": True,
            "withDriverSupported": True,
            "selfDriveSupported": bool(c.deposit and c.deposit > 0),
            "isAvailableOnDate": is_avail,
            "availabilityNote": "Available for reservation" if is_avail else f"Reserved on {date}",
        })

    return {
        "ok": True,
        "dateChecked": date,
        "total": len(catalogue),
        "cars": catalogue,
    }


@app.get("/api/decorations/driver-pricing")
def get_driver_pricing(db: Session = Depends(get_db)):
    """Fetch current driver pricing configuration rules."""
    cfg = get_driver_pricing_config(db)
    return {"ok": True, "driverPricing": serialize_driver_pricing_config(cfg)}


@app.get("/api/decorations/check-availability")
def check_wedding_availability(
    date: str = Query(..., min_length=8),
    carId: Optional[int] = None,
    driverId: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """Checks date availability for a vehicle and driver before reservation."""
    date_str = date.strip()
    car_available = True
    car_conflict_ref = None

    if carId:
        # Check car in wedding decoration bookings
        conf_wb = (
            db.query(WeddingDecorationBooking)
            .filter(
                WeddingDecorationBooking.car_id == carId,
                WeddingDecorationBooking.event_date == date_str,
                WeddingDecorationBooking.status.in_(["Confirmed", "In Progress"]),
            )
            .first()
        )
        if conf_wb:
            car_available = False
            car_conflict_ref = conf_wb.ref
        else:
            # Check regular bookings
            conf_b = (
                db.query(Booking)
                .filter(
                    Booking.car_id == carId,
                    Booking.status == "Confirmed",
                    Booking.start_time <= f"{date_str}T23:59:59",
                    Booking.end_time >= f"{date_str}T00:00:00",
                )
                .first()
            )
            if conf_b:
                car_available = False
                car_conflict_ref = conf_b.ref

    driver_available = True
    driver_conflict_ref = None
    if driverId:
        conf_driver = (
            db.query(WeddingDecorationBooking)
            .filter(
                WeddingDecorationBooking.driver_id == driverId,
                WeddingDecorationBooking.event_date == date_str,
                WeddingDecorationBooking.status.in_(["Confirmed", "In Progress"]),
            )
            .first()
        )
        if conf_driver:
            driver_available = False
            driver_conflict_ref = conf_driver.ref

    # Also list available drivers for this date
    all_drivers = db.query(Driver).filter(Driver.is_active == True).all()
    busy_driver_ids = {
        row[0]
        for row in db.query(WeddingDecorationBooking.driver_id)
        .filter(
            WeddingDecorationBooking.event_date == date_str,
            WeddingDecorationBooking.status.in_(["Confirmed", "In Progress"]),
            WeddingDecorationBooking.driver_id != None,
        )
        .all()
    }
    avail_drivers = [serialize_driver(d) for d in all_drivers if d.id not in busy_driver_ids]

    return {
        "ok": True,
        "date": date_str,
        "carAvailable": car_available,
        "carConflictRef": car_conflict_ref,
        "driverAvailable": driver_available,
        "driverConflictRef": driver_conflict_ref,
        "availableDrivers": avail_drivers,
    }


@app.post("/api/decorations/calculate-price")
def calculate_decoration_price(payload: dict, db: Session = Depends(get_db)):
    """Authoritative price breakdown calculation for wedding decoration with driver options."""
    pkg_id = payload.get("packageId") or payload.get("package_id")
    if not pkg_id:
        raise HTTPException(status_code=400, detail="Package ID is required.")

    pkg = db.query(DecorationPackage).filter(DecorationPackage.id == pkg_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Decoration package not found.")

    car = None
    car_id = payload.get("carId") or payload.get("car_id")
    if car_id:
        car = db.query(Car).filter(Car.id == car_id).first()

    drive_mode = payload.get("driveMode") or payload.get("drive_mode") or ("with_driver" if car else "decor_only")
    expected_hours = payload.get("expectedDurationHours") or payload.get("expected_duration_hours") or 8
    expected_km = payload.get("expectedDistanceKm") or payload.get("expected_distance_km") or 100
    addons = payload.get("additionalAddons") or payload.get("addons") or []
    city = payload.get("serviceCity") or payload.get("service_city") or "Nagercoil"
    venue = payload.get("venueLocation") or payload.get("venue_location") or ""

    driver_cfg = get_driver_pricing_config(db)

    pricing = calculate_wedding_pricing(
        package=pkg,
        car=car,
        drive_mode=drive_mode,
        expected_duration_hours=expected_hours,
        expected_distance_km=expected_km,
        additional_addons=addons,
        service_city=city,
        venue_location=venue,
        driver_cfg=driver_cfg,
    )

    return {
        "ok": True,
        "pricing": pricing,
        "package": {"id": pkg.id, "name": pkg.name, "startingPrice": pkg.starting_price, "theme": pkg.theme},
        "car": {"id": car.id, "name": f"{car.brand} {car.model}", "pricePerDay": car.price_per_day, "deposit": car.deposit} if car else None,
        "driveMode": drive_mode,
    }


@app.post("/api/decorations/upload-image")
async def upload_decoration_image(file: UploadFile = File(...)):
    """Uploads customer reference images or decoration package photos."""
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No image file provided.")

    orig_ext = Path(file.filename).suffix.lower()
    if orig_ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only JPG, JPEG, PNG, and WEBP formats are accepted.")

    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_IMAGE_MIMES:
        raise HTTPException(status_code=400, detail=f"Invalid image type '{content_type}'.")

    chunk_size = 1024 * 64
    total_bytes = 0
    chunks = []
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total_bytes += len(chunk)
        if total_bytes > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(status_code=400, detail="Image exceeds maximum allowed size of 5 MB.")
        chunks.append(chunk)

    if total_bytes == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    unique_name = f"decor_{int(time.time())}_{uuid.uuid4().hex[:8]}{orig_ext}"
    dest_path = DECOR_UPLOADS_DIR / unique_name
    with open(dest_path, "wb") as f:
        for c in chunks:
            f.write(c)

    url = f"/uploads/decorations/{unique_name}"
    return {
        "ok": True,
        "url": url,
        "filename": unique_name,
        "size": total_bytes,
        "message": "Decoration image uploaded successfully.",
    }


@app.post("/api/decorations/bookings", status_code=status.HTTP_201_CREATED)
def create_wedding_decoration_booking(
    payload: WeddingDecorationBookingCreateRequest,
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Submits a wedding car decoration booking request with authoritative price calculation."""
    pkg = db.query(DecorationPackage).filter(DecorationPackage.id == payload.packageId).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Selected decoration package does not exist.")
    if not pkg.is_active:
        raise HTTPException(status_code=400, detail="Selected decoration package is currently inactive.")

    car = None
    if payload.carId and payload.driveMode != "decor_only":
        car = db.query(Car).filter(Car.id == payload.carId).with_for_update().first()
        if not car:
            raise HTTPException(status_code=404, detail="Selected car does not exist.")
        if not car.available:
            raise HTTPException(status_code=400, detail=f"{car.brand} {car.model} is currently marked unavailable.")

        # Compatibility check: if decoration package specifies compatible_categories, enforce it!
        compat_cats = pkg.compatible_categories
        if isinstance(compat_cats, str):
            try:
                compat_cats = json.loads(compat_cats)
            except Exception:
                compat_cats = None

        if isinstance(compat_cats, list) and len(compat_cats) > 0:
            if car.category not in compat_cats:
                raise HTTPException(
                    status_code=400,
                    detail=f"The design '{pkg.name}' cannot be fitted to {car.brand} {car.model} ({car.category}). Compatible vehicle types: {', '.join(compat_cats)}.",
                )

        # Check existing confirmed wedding booking for this car on the requested event date
        existing_conf = (
            db.query(WeddingDecorationBooking)
            .filter(
                WeddingDecorationBooking.car_id == car.id,
                WeddingDecorationBooking.event_date == payload.eventDate.strip(),
                WeddingDecorationBooking.status.in_(["Confirmed", "In Progress"]),
            )
            .first()
        )
        if existing_conf:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{car.brand} {car.model} is already reserved for another wedding event on {payload.eventDate}. Please choose another vehicle or select decoration-only service.",
            )

        # Check overlapping standard rental booking
        existing_rental = (
            db.query(Booking)
            .filter(
                Booking.car_id == car.id,
                Booking.status == "Confirmed",
                Booking.start_time <= f"{payload.eventDate.strip()}T23:59:59",
                Booking.end_time >= f"{payload.eventDate.strip()}T00:00:00",
            )
            .first()
        )
        if existing_rental:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{car.brand} {car.model} is already booked for highway rental on {payload.eventDate}. Please choose another vehicle.",
            )

    # Driver check if driver requested
    driver_id = None
    if payload.driveMode == "with_driver":
        if payload.driverId:
            driver = db.query(Driver).filter(Driver.id == payload.driverId).first()
            if not driver or not driver.is_active:
                raise HTTPException(status_code=400, detail="Selected driver is not active or does not exist.")

            # Driver conflict check
            conf_d = (
                db.query(WeddingDecorationBooking)
                .filter(
                    WeddingDecorationBooking.driver_id == driver.id,
                    WeddingDecorationBooking.event_date == payload.eventDate.strip(),
                    WeddingDecorationBooking.status.in_(["Confirmed", "In Progress"]),
                )
                .first()
            )
            if conf_d:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Driver {driver.name} is already assigned to confirmed booking {conf_d.ref} on {payload.eventDate}.",
                )
            driver_id = driver.id

    driver_cfg = get_driver_pricing_config(db)

    # Authoritative server-side pricing
    pricing = calculate_wedding_pricing(
        package=pkg,
        car=car,
        drive_mode=payload.driveMode or ("with_driver" if car else "decor_only"),
        expected_duration_hours=payload.expectedDurationHours or 8,
        expected_distance_km=payload.expectedDistanceKm or 100,
        additional_addons=payload.additionalAddons or [],
        service_city=payload.serviceCity or "Nagercoil",
        venue_location=payload.venueLocation,
        driver_cfg=driver_cfg,
    )

    ref = generate_wedding_ref(db)
    booking = WeddingDecorationBooking(
        ref=ref,
        user_id=user.id if user else None,
        package_id=pkg.id,
        car_id=car.id if car else None,
        customer_name=payload.customerName.strip(),
        customer_phone=payload.customerPhone.strip(),
        customer_email=payload.customerEmail.lower().strip(),
        event_type=payload.eventType.strip(),
        event_date=payload.eventDate.strip(),
        completion_time=payload.completionTime.strip(),
        venue_location=payload.venueLocation.strip(),
        pickup_location=(payload.pickupLocation or "").strip(),
        destination=(payload.destination or "").strip(),
        service_city=(payload.serviceCity or "Nagercoil").strip(),
        drive_mode=payload.driveMode or ("with_driver" if car else "decor_only"),
        expected_duration_hours=payload.expectedDurationHours or 8,
        expected_distance_km=payload.expectedDistanceKm or 100,
        driver_id=driver_id,
        flower_colors=(payload.flowerColors or "").strip(),
        decor_style=(payload.decorStyle or "").strip(),
        special_notes=(payload.specialNotes or "").strip(),
        reference_image=(payload.referenceImage or "").strip(),
        car_rental_included=bool(car is not None and payload.driveMode != "decor_only"),
        pricing=pricing,
        status="Pending",
        payment_status="Pending",
    )
    db.add(booking)

    if user:
        car_name = f"{car.brand} {car.model}" if car else "Decoration Service"
        drive_text = "With Driver" if booking.drive_mode == "with_driver" else ("Self-Drive" if booking.drive_mode == "self_drive" else "Decor Only")
        notif = Notification(
            user_id=user.id,
            booking_ref=ref,
            title=f"Wedding Decor Request: {ref}",
            message=f"Your booking for {pkg.name} ({car_name} · {drive_text}) on {booking.event_date} has been submitted. Our floral stylist will confirm shortly.",
            type="booking",
            link="/dashboard?tab=wedding",
        )
        db.add(notif)

    db.commit()
    db.refresh(booking)

    return {
        "ok": True,
        "message": f"Wedding decoration booking request {ref} submitted successfully. Our team will contact you to coordinate setup.",
        "booking": serialize_wedding_booking(booking),
    }


@app.get("/api/decorations/bookings/my")
def list_my_wedding_bookings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch wedding decoration bookings for the authenticated customer."""
    bookings = (
        db.query(WeddingDecorationBooking)
        .filter(
            or_(
                WeddingDecorationBooking.user_id == user.id,
                WeddingDecorationBooking.customer_email == user.email.lower(),
            )
        )
        .order_by(WeddingDecorationBooking.created_at.desc())
        .all()
    )
    return {"ok": True, "bookings": [serialize_wedding_booking(b) for b in bookings]}


@app.get("/api/decorations/bookings/{ref}")
def get_wedding_booking_by_ref(
    ref: str,
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Retrieve wedding decoration booking by reference with owner isolation."""
    b = db.query(WeddingDecorationBooking).filter(WeddingDecorationBooking.ref == ref).first()
    if not b:
        raise HTTPException(status_code=404, detail="Wedding decoration booking not found.")

    is_authorized = bool(
        (user and user.role == "admin") or
        (user and b.user_id == user.id) or
        (user and b.customer_email.lower() == user.email.lower()) or
        (not b.user_id)  # newly created guest
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Access denied. You can only view your own decoration bookings.")

    return {"ok": True, "booking": serialize_wedding_booking(b)}


# ==========================================================
# --- Admin Wedding Decoration Management Endpoints ---
# ==========================================================

@app.get("/api/admin/decorations/packages")
def list_admin_decoration_packages(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Admin view of all decoration packages including inactive packages."""
    pkgs = db.query(DecorationPackage).order_by(DecorationPackage.sort_order.asc(), DecorationPackage.id.asc()).all()
    return {"ok": True, "packages": [serialize_decoration_package(p) for p in pkgs]}


@app.post("/api/admin/decorations/packages", status_code=status.HTTP_201_CREATED)
def create_decoration_package(
    payload: DecorationPackageCreateUpdateRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Admin creates a new decoration package."""
    slug = re.sub(r"[^a-z0-9]+", "-", payload.name.lower()).strip("-")
    # Guarantee unique slug
    base_slug = slug
    counter = 1
    while db.query(DecorationPackage).filter(DecorationPackage.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    pkg = DecorationPackage(
        name=payload.name.strip(),
        slug=slug,
        starting_price=payload.startingPrice,
        description=payload.description.strip(),
        category=payload.category or "Floral",
        image=payload.image.strip(),
        gallery=payload.gallery or [payload.image.strip()],
        included_items=payload.includedItems,
        duration=payload.duration or "2 - 3 Hours",
        service_areas=payload.serviceAreas or "Nagercoil, Kanyakumari & Surrounding Districts",
        is_active=bool(payload.isActive),
        sort_order=payload.sortOrder or 0,
    )
    db.add(pkg)
    db.commit()
    db.refresh(pkg)
    return {"ok": True, "package": serialize_decoration_package(pkg), "message": "Package created successfully."}


@app.put("/api/admin/decorations/packages/{package_id}")
def update_decoration_package(
    package_id: int,
    payload: DecorationPackageCreateUpdateRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Admin updates starting price, included items, description, or status of a package."""
    pkg = db.query(DecorationPackage).filter(DecorationPackage.id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Decoration package not found.")

    if payload.name:
        pkg.name = payload.name.strip()
    if payload.startingPrice is not None:
        pkg.starting_price = payload.startingPrice
    if payload.description:
        pkg.description = payload.description.strip()
    if payload.category:
        pkg.category = payload.category.strip()
    if payload.badge is not None:
        pkg.badge = payload.badge.strip() if payload.badge else None
    if payload.subtitle is not None:
        pkg.subtitle = payload.subtitle.strip() if payload.subtitle else None
    if payload.image:
        pkg.image = payload.image.strip()
    if payload.gallery is not None:
        pkg.gallery = payload.gallery
    if payload.includedItems is not None:
        pkg.included_items = payload.includedItems
    if payload.compatibleCategories is not None:
        pkg.compatible_categories = payload.compatibleCategories
    if payload.duration:
        pkg.duration = payload.duration.strip()
    if payload.serviceAreas:
        pkg.service_areas = payload.serviceAreas.strip()
    if payload.isActive is not None:
        pkg.is_active = bool(payload.isActive)
    if payload.sortOrder is not None:
        pkg.sort_order = payload.sortOrder

    db.commit()
    db.refresh(pkg)
    return {"ok": True, "package": serialize_decoration_package(pkg), "message": f"Updated package '{pkg.name}'."}


@app.delete("/api/admin/decorations/packages/{package_id}")
def delete_decoration_package(
    package_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Admin disables or deletes a package."""
    pkg = db.query(DecorationPackage).filter(DecorationPackage.id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Decoration package not found.")

    has_bookings = db.query(WeddingDecorationBooking).filter(WeddingDecorationBooking.package_id == package_id).first()
    if has_bookings:
        # Soft delete / deactivate to maintain foreign key integrity
        pkg.is_active = False
        db.commit()
        return {"ok": True, "action": "deactivated", "message": f"Package '{pkg.name}' has existing booking records and was deactivated."}

    db.delete(pkg)
    db.commit()
    return {"ok": True, "action": "deleted", "message": f"Package '{pkg.name}' was permanently removed."}


@app.get("/api/admin/decorations/bookings")
def list_admin_wedding_bookings(
    status: Optional[str] = None,
    search: Optional[str] = None,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Admin views, searches, and filters all wedding decoration bookings."""
    query = db.query(WeddingDecorationBooking).join(DecorationPackage, WeddingDecorationBooking.package_id == DecorationPackage.id)

    if status and status != "all":
        query = query.filter(WeddingDecorationBooking.status == status)

    if search and search.strip():
        q = f"%{search.strip().lower()}%"
        query = query.filter(
            (WeddingDecorationBooking.ref.ilike(q)) |
            (WeddingDecorationBooking.customer_name.ilike(q)) |
            (WeddingDecorationBooking.customer_phone.ilike(q)) |
            (WeddingDecorationBooking.customer_email.ilike(q)) |
            (WeddingDecorationBooking.venue_location.ilike(q)) |
            (DecorationPackage.name.ilike(q))
        )

    bookings = query.order_by(WeddingDecorationBooking.created_at.desc()).all()

    all_b = db.query(WeddingDecorationBooking).all()
    pending_count = sum(1 for b in all_b if b.status == "Pending")
    confirmed_count = sum(1 for b in all_b if b.status == "Confirmed")
    completed_count = sum(1 for b in all_b if b.status == "Completed")
    cancelled_count = sum(1 for b in all_b if b.status == "Cancelled")

    return {
        "ok": True,
        "stats": {
            "total": len(all_b),
            "pending": pending_count,
            "confirmed": confirmed_count,
            "completed": completed_count,
            "cancelled": cancelled_count,
        },
        "bookings": [serialize_wedding_booking(b) for b in bookings],
    }


@app.get("/api/admin/decorations/drivers")
def list_admin_drivers(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Admin views all registered wedding chauffeurs and their active status."""
    drivers = db.query(Driver).order_by(Driver.rating.desc(), Driver.id.asc()).all()
    return {"ok": True, "drivers": [serialize_driver(d) for d in drivers]}


@app.post("/api/admin/decorations/drivers", status_code=status.HTTP_201_CREATED)
def create_admin_driver(
    payload: DriverCreateUpdateRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Admin creates a verified chauffeur record."""
    d = Driver(
        name=payload.name.strip(),
        phone=payload.phone.strip(),
        license_number=payload.licenseNumber.strip().upper(),
        experience_years=payload.experienceYears or 5,
        rating=payload.rating or 4.9,
        photo=payload.photo,
        is_active=bool(payload.isActive),
        city=payload.city.strip() if payload.city else "Nagercoil",
        notes=payload.notes.strip() if payload.notes else "",
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return {"ok": True, "message": f"Driver {d.name} added successfully.", "driver": serialize_driver(d)}


@app.put("/api/admin/decorations/drivers/{driver_id}")
def update_admin_driver(
    driver_id: int,
    payload: DriverCreateUpdateRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Admin updates driver details or toggles active status."""
    d = db.query(Driver).filter(Driver.id == driver_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Driver record not found.")

    d.name = payload.name.strip()
    d.phone = payload.phone.strip()
    d.license_number = payload.licenseNumber.strip().upper()
    d.experience_years = payload.experienceYears or d.experience_years
    d.rating = payload.rating or d.rating
    if payload.photo is not None:
        d.photo = payload.photo
    if payload.isActive is not None:
        d.is_active = bool(payload.isActive)
    if payload.city:
        d.city = payload.city.strip()
    if payload.notes is not None:
        d.notes = payload.notes.strip()

    db.commit()
    db.refresh(d)
    return {"ok": True, "message": f"Driver {d.name} updated.", "driver": serialize_driver(d)}


@app.delete("/api/admin/decorations/drivers/{driver_id}")
def delete_admin_driver(
    driver_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Admin deactivates or removes a driver."""
    d = db.query(Driver).filter(Driver.id == driver_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Driver not found.")

    has_bookings = db.query(WeddingDecorationBooking).filter(WeddingDecorationBooking.driver_id == driver_id).first()
    if has_bookings:
        d.is_active = False
        db.commit()
        return {"ok": True, "action": "deactivated", "message": f"Driver {d.name} has booking history and was deactivated."}

    db.delete(d)
    db.commit()
    return {"ok": True, "action": "deleted", "message": f"Driver {d.name} was removed."}


@app.get("/api/admin/decorations/driver-pricing")
def get_admin_driver_pricing(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Admin gets driver fee configuration rules."""
    cfg = get_driver_pricing_config(db)
    return {"ok": True, "driverPricing": serialize_driver_pricing_config(cfg)}


@app.put("/api/admin/decorations/driver-pricing")
def update_admin_driver_pricing(
    payload: DriverPricingConfigUpdateRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Admin updates driver rate rules: base fee, included hours, extra km, overtime."""
    cfg = get_driver_pricing_config(db)
    cfg.base_driver_fee = payload.baseDriverFee
    cfg.included_hours = payload.includedHours
    cfg.included_km = payload.includedKm
    cfg.overtime_rate_per_hour = payload.overtimeRatePerHour
    cfg.extra_km_rate = payload.extraKmRate
    if payload.isActive is not None:
        cfg.is_active = bool(payload.isActive)

    db.commit()
    db.refresh(cfg)
    return {
        "ok": True,
        "message": "Driver pricing rules updated successfully.",
        "driverPricing": serialize_driver_pricing_config(cfg),
    }


@app.patch("/api/admin/decorations/bookings/{booking_id}/assign-driver")
def assign_driver_to_wedding_booking(
    booking_id: int,
    payload: DriverAssignRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Assigns or changes a driver for a confirmed wedding booking with conflict checking."""
    b = db.query(WeddingDecorationBooking).filter(WeddingDecorationBooking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Wedding decoration booking not found.")

    if not payload.driverId:
        b.driver_id = None
        db.commit()
        db.refresh(b)
        return {"ok": True, "message": "Driver unassigned from booking.", "booking": serialize_wedding_booking(b)}

    driver = db.query(Driver).filter(Driver.id == payload.driverId).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver record not found.")
    if not driver.is_active:
        raise HTTPException(status_code=400, detail=f"Driver {driver.name} is currently inactive.")

    # Overlap check: ensure same driver is NOT assigned to another confirmed/in-progress booking on this same event date!
    conflict = (
        db.query(WeddingDecorationBooking)
        .filter(
            WeddingDecorationBooking.driver_id == driver.id,
            WeddingDecorationBooking.event_date == b.event_date,
            WeddingDecorationBooking.id != b.id,
            WeddingDecorationBooking.status.in_(["Confirmed", "In Progress"]),
        )
        .first()
    )
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Driver {driver.name} is already assigned to confirmed booking {conflict.ref} on {b.event_date}. Please choose another available driver.",
        )

    b.driver_id = driver.id

    if b.user_id:
        notif = Notification(
            user_id=b.user_id,
            booking_ref=b.ref,
            title="Chauffeur Assigned",
            message=f"Chauffeur {driver.name} (Phone: {driver.phone}) has been assigned to your wedding car for {b.event_date}.",
            type="booking",
            link="/dashboard?tab=wedding",
        )
        db.add(notif)

    db.commit()
    db.refresh(b)
    return {
        "ok": True,
        "message": f"Chauffeur {driver.name} assigned to booking {b.ref}.",
        "booking": serialize_wedding_booking(b),
    }


@app.patch("/api/admin/decorations/bookings/{booking_id}/status")
def update_wedding_booking_status(
    booking_id: int,
    payload: WeddingBookingStatusUpdateRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Admin updates wedding decoration booking status (Pending, Confirmed, Completed, Cancelled)."""
    b = db.query(WeddingDecorationBooking).filter(WeddingDecorationBooking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Wedding decoration booking not found.")

    old_status = b.status
    b.status = payload.status
    if payload.paymentStatus:
        b.payment_status = payload.paymentStatus
    if payload.adminNotes:
        b.admin_notes = payload.adminNotes.strip()

    if b.user_id:
        notif = Notification(
            user_id=b.user_id,
            booking_ref=b.ref,
            title=f"Wedding Booking: {payload.status}",
            message=f"Your wedding decoration booking {b.ref} status was updated to {payload.status}.",
            type="booking",
            link="/dashboard?tab=wedding",
        )
        db.add(notif)

    db.commit()
    db.refresh(b)
    return {"ok": True, "message": f"Status updated to {payload.status}.", "booking": serialize_wedding_booking(b)}





if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)


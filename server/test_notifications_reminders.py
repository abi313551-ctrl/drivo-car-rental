import os
import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=== Testing Drivo Booking Reminder and Notification System ===")

    # 1. Health check
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200
    print("[PASS] Health check verified")

    # 2. Verify Email Config (Missing credentials reporting)
    cfg_res = requests.get(f"{BASE_URL}/notifications/email-config")
    assert cfg_res.status_code == 200
    cfg = cfg_res.json()["config"]
    assert "configured" in cfg
    assert "setupGuide" in cfg
    print(f"[PASS] Email config inspected: configured={cfg['configured']}, fromEmail={cfg['fromEmail']}")

    # 3. Authenticate Customer & Admin
    admin_login = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@drivo.example", "password": "password123"},
    )
    assert admin_login.status_code == 200
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['token']}"}

    cust_login = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "priya@drivo.example", "password": "password123"},
    )
    assert cust_login.status_code == 200
    cust_token = cust_login.json()["token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    cust_id = cust_login.json()["user"]["id"]
    print(f"[PASS] Authenticated Admin and Customer Priya (ID: {cust_id})")

    # 4. Customer Notification Preferences
    pref_res = requests.get(f"{BASE_URL}/user/notification-preferences", headers=cust_headers)
    assert pref_res.status_code == 200
    prefs = pref_res.json()["preferences"]
    assert "emailNotifsEnabled" in prefs
    assert "pickupRemindersEnabled" in prefs
    assert "returnRemindersEnabled" in prefs
    print(f"[PASS] Customer notification preferences fetched: {prefs}")

    # Update preferences
    update_pref_res = requests.patch(
        f"{BASE_URL}/user/notification-preferences",
        headers=cust_headers,
        json={
            "emailNotifsEnabled": True,
            "pickupRemindersEnabled": True,
            "returnRemindersEnabled": False,
        },
    )
    assert update_pref_res.status_code == 200
    updated_prefs = update_pref_res.json()["preferences"]
    assert updated_prefs["returnRemindersEnabled"] is False
    print("[PASS] Customer updated notification preferences successfully")

    # Reset back to True
    requests.patch(
        f"{BASE_URL}/user/notification-preferences",
        headers=cust_headers,
        json={"emailNotifsEnabled": True, "pickupRemindersEnabled": True, "returnRemindersEnabled": True},
    )

    # 5. Create Booking and Verify Automatic Reminder Scheduling
    book_res = requests.post(
        f"{BASE_URL}/bookings",
        headers=cust_headers,
        json={
            "carId": 1,
            "pickup": "Bengaluru Airport Terminal 1 Hub",
            "dropoff": "Bengaluru Airport Terminal 1 Hub",
            "start": "2026-11-28T10:00",
            "end": "2026-11-30T10:00",
            "customer": {
                "fullName": "Priya Sharma",
                "email": "priya@drivo.example",
                "phone": "9876543210",
                "license": "KA0120190012345",
            },
        },
    )
    assert book_res.status_code == 201, f"Booking creation failed: {book_res.text}"
    b_data = book_res.json()["booking"]
    booking_ref = b_data["ref"]
    booking_id = b_data["id"]
    print(f"[PASS] Created booking {booking_ref}")

    # 6. Admin Reminders Inspection: Check scheduled reminders for this booking
    admin_rem_res = requests.get(
        f"{BASE_URL}/admin/reminders?search={booking_ref}",
        headers=admin_headers,
    )
    assert admin_rem_res.status_code == 200
    reminders = admin_rem_res.json()["reminders"]
    reminder_types = [r["reminderType"] for r in reminders]
    assert "booking_confirmation" in reminder_types, "Expected booking_confirmation scheduled"
    assert "pickup_reminder" in reminder_types, "Expected pickup_reminder scheduled"
    assert "return_reminder" in reminder_types, "Expected return_reminder scheduled"
    print(f"[PASS] 3 Reminders automatically scheduled in MySQL: {reminder_types}")

    # 7. Process Due Reminders (Confirmation is due immediately)
    process_res = requests.post(f"{BASE_URL}/admin/reminders/process", headers=admin_headers)
    assert process_res.status_code == 200
    proc_result = process_res.json()["result"]
    print(f"[PASS] Batch reminder processing executed: {proc_result['processed']} processed")

    # 8. Check In-App Customer Notification Created
    notif_res = requests.get(f"{BASE_URL}/notifications", headers=cust_headers)
    assert notif_res.status_code == 200
    my_notifs = notif_res.json()["notifications"]
    assert len(my_notifs) > 0
    latest_notif = my_notifs[0]
    print(f"[PASS] In-app notification received in customer dashboard: '{latest_notif['title']}'")

    # 9. Mark Single Notification Read & Mark All Read
    read_res = requests.patch(f"{BASE_URL}/notifications/{latest_notif['id']}/read", headers=cust_headers)
    assert read_res.status_code == 200
    print(f"[PASS] Notification {latest_notif['id']} marked as read")

    read_all_res = requests.post(f"{BASE_URL}/notifications/read-all", headers=cust_headers)
    assert read_all_res.status_code == 200
    print("[PASS] All notifications marked as read")

    # 10. Cancellation & Scheduled Reminders Cancellation (Requirement 11)
    # Cancel the booking
    cancel_res = requests.post(f"{BASE_URL}/bookings/{booking_ref}/cancel", headers=cust_headers)
    assert cancel_res.status_code == 200
    print(f"[PASS] Booking {booking_ref} cancelled")

    # Verify that scheduled pickup & return reminders were cancelled
    admin_rem_res2 = requests.get(
        f"{BASE_URL}/admin/reminders?search={booking_ref}",
        headers=admin_headers,
    )
    assert admin_rem_res2.status_code == 200
    post_cancel_reminders = admin_rem_res2.json()["reminders"]
    pickup_rem = next((r for r in post_cancel_reminders if r["reminderType"] == "pickup_reminder"), None)
    return_rem = next((r for r in post_cancel_reminders if r["reminderType"] == "return_reminder"), None)
    assert pickup_rem["status"] == "cancelled", f"Expected pickup reminder cancelled, got {pickup_rem['status']}"
    assert return_rem["status"] == "cancelled", f"Expected return reminder cancelled, got {return_rem['status']}"
    print("[PASS] Confirmed: Scheduled pickup & return reminders were safely cancelled (no reminders sent for cancelled bookings!)")

    # Check that cancellation notification reminder was scheduled
    cancel_rem = next((r for r in post_cancel_reminders if r["reminderType"] == "booking_cancellation"), None)
    assert cancel_rem is not None, "Expected booking_cancellation reminder created"
    print(f"[PASS] Booking cancellation notification queued: '{cancel_rem['subject']}'")

    print("\nALL 10 BOOKING REMINDER & NOTIFICATION TESTS PASSED SUCCESSFULLY! :)")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n[FAIL] Test failed with error: {e}")
        sys.exit(1)

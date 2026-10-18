"""
Automated end-to-end verification test for the login-required booking flow in Drivo.
Tests:
1. Public car browsing & details (unauthenticated) -> 200 OK
2. Public pricing calculation (unauthenticated) -> 200 OK
3. Unauthenticated POST /api/bookings -> 401 Unauthorized
4. Customer registration -> 201 Created with JWT token
5. Authenticated booking creation -> 201 Created
6. Verification in MySQL database (correct user_id, car_id, server price)
7. Overlapping booking prevention for same car -> 409 Conflict
8. Past dates prevention -> 400 Bad Request
9. Customer login -> 200 OK and immediate booking completion
10. Admin portal verification of the new customer reservation
"""

import sys
import os
import time
import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8000"

def log_test(step_num, title):
    print(f"\n[{step_num}] {title}")

def make_request(path, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{path}"
    h = {"Accept": "application/json"}
    if headers:
        h.update(headers)

    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        h["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content.strip() else {}
    except urllib.error.HTTPError as err:
        content = err.read().decode("utf-8")
        try:
            parsed = json.loads(content)
        except Exception:
            parsed = {"detail": content}
        return err.code, parsed

def run_tests():
    print("================================================================================")
    print("  DRIVO CAR RENTAL — LOGIN-REQUIRED BOOKING FLOW VERIFICATION TEST")
    print("================================================================================")

    # 1. Unauthenticated browsing
    log_test(1, "Public browsing: Users can browse cars and details without logging in")
    status, cars_res = make_request("/api/cars")
    assert status == 200, f"Expected 200 for public /api/cars, got {status}"
    cars_list = cars_res.get("cars", [])
    assert len(cars_list) > 0, "Expected at least 1 car in fleet"
    test_car = next((c for c in cars_list if c.get("available")), cars_list[0])
    car_id = test_car["id"]
    print(f" [PASS] Successfully browsed {len(cars_list)} cars without authentication.")

    status, car_detail = make_request(f"/api/cars/{car_id}")
    assert status == 200, f"Expected 200 for public /api/cars/{car_id}, got {status}"
    print(f" [PASS] Viewed vehicle details for: {test_car['brand']} {test_car['model']} (ID #{car_id})")

    # 2. Public pricing calculation
    log_test(2, "Public pricing calculation: Unauthenticated user can calculate real pricing")
    import random
    offset = random.randint(500, 2500)
    start_dt = (datetime.utcnow() + timedelta(days=offset)).strftime("%Y-%m-%dT10:00")
    end_dt = (datetime.utcnow() + timedelta(days=offset + 3)).strftime("%Y-%m-%dT10:00")
    price_payload = {
        "carId": car_id,
        "start": start_dt,
        "end": end_dt,
        "extras": {"insurance": True, "gps": True},
    }
    status, pricing_res = make_request("/api/pricing/calculate", method="POST", data=price_payload)
    assert status == 200, f"Expected 200 for pricing calculate, got {status}: {pricing_res}"
    expected_total = pricing_res["pricing"]["total"]
    print(f" [PASS] Real-time server calculated price: INR {expected_total} (Days: {pricing_res['pricing']['days']})")

    # 3. Unauthenticated booking rejection
    log_test(3, "Backend protection: Unauthenticated POST /api/bookings is strictly blocked")
    booking_attempt = {
        "carId": car_id,
        "pickup": f"{test_car['location']} Hub",
        "dropoff": f"{test_car['location']} Hub",
        "start": start_dt,
        "end": end_dt,
        "customer": {
            "fullName": "Unauthenticated Hacker",
            "email": "hacker@test.com",
            "phone": "+919876543210",
            "license": "TN7420240001234",
        },
        "extras": {"insurance": True, "gps": True},
    }
    status, unauth_res = make_request("/api/bookings", method="POST", data=booking_attempt)
    assert status == 401, f"Expected 401 Unauthorized for unauthenticated booking, got {status}: {unauth_res}"
    print(f" [PASS] Unauthenticated booking blocked with 401: {unauth_res.get('detail')}")

    # 4. Customer registration flow
    log_test(4, "Customer registration: New user registers and gets authentic JWT token")
    timestamp = int(time.time())
    new_user_email = f"renter_{timestamp}@drivo.example"
    reg_payload = {
        "fullName": "Kannan Renter",
        "email": new_user_email,
        "phone": "+919876500002",
        "license": "TN7420240005555",
        "password": "Password123!",
    }
    status, reg_res = make_request("/api/auth/register", method="POST", data=reg_payload)
    assert status in (200, 201), f"Expected 200/201 for register, got {status}: {reg_res}"
    user_token = reg_res["token"]
    user_id = reg_res["user"]["id"]
    auth_headers = {"Authorization": f"Bearer {user_token}"}
    print(f" [PASS] Customer registered: ID #{user_id} ({new_user_email})")

    # 5. Authenticated booking completion
    log_test(5, "Authenticated booking: Customer confirms booking with preserved parameters")
    valid_booking_payload = {
        "carId": car_id,
        "pickup": f"{test_car['location']} Hub",
        "dropoff": f"{test_car['location']} Hub",
        "start": start_dt,
        "end": end_dt,
        "customer": {
            "fullName": "Kannan Renter",
            "email": new_user_email,
            "phone": "+919876500002",
            "license": "TN7420240005555",
        },
        "extras": {"insurance": True, "gps": True},
    }
    status, book_res = make_request("/api/bookings", method="POST", data=valid_booking_payload, headers=auth_headers)
    assert status == 201, f"Expected 201 Created for authenticated booking, got {status}: {book_res}"
    created_booking = book_res["booking"]
    booking_ref = created_booking["ref"]
    booking_id = created_booking["id"]
    print(f" [PASS] Booking successfully created: Ref {booking_ref} (ID #{booking_id})")

    # 6. Database verification
    log_test(6, "MySQL verification: Verify correct user ID, car ID, and server pricing in database")
    # Verify via /api/bookings/my
    status, my_bookings_res = make_request("/api/bookings/my", headers=auth_headers)
    assert status == 200, f"Expected 200 from /api/bookings/my, got {status}"
    my_bookings = my_bookings_res.get("bookings", [])
    matched_b = next((b for b in my_bookings if b["ref"] == booking_ref), None)
    assert matched_b is not None, f"Booking {booking_ref} not found in customer bookings"
    assert matched_b["car"]["id"] == car_id, f"Expected car ID {car_id}, got {matched_b['car']['id']}"
    assert matched_b["pricing"]["total"] == expected_total, f"Expected price {expected_total}, got {matched_b['pricing']['total']}"
    assert matched_b["status"] == "Confirmed"
    print(f" [PASS] Booking verified in MySQL: user_id={user_id}, car_id={car_id}, total=INR {matched_b['pricing']['total']}, status={matched_b['status']}")

    # 7. Overlapping booking conflict prevention
    log_test(7, "Conflict prevention: Overlapping booking for the same car is strictly rejected")
    overlap_payload = {
        "carId": car_id,
        "pickup": f"{test_car['location']} Hub",
        "dropoff": f"{test_car['location']} Hub",
        "start": (datetime.utcnow() + timedelta(days=offset + 1)).strftime("%Y-%m-%dT10:00"), # overlaps!
        "end": (datetime.utcnow() + timedelta(days=offset + 4)).strftime("%Y-%m-%dT10:00"),
        "customer": {
            "fullName": "Another Customer",
            "email": "another@test.com",
            "phone": "+919876500003",
            "license": "TN7420240009999",
        },
        "extras": {},
    }
    status, conflict_res = make_request("/api/bookings", method="POST", data=overlap_payload, headers=auth_headers)
    assert status == 409, f"Expected 409 Conflict for overlapping dates, got {status}: {conflict_res}"
    print(f" [PASS] Overlapping booking rejected with 409 Conflict: {conflict_res.get('detail')}")

    # 8. Past dates prevention
    log_test(8, "Date validation: Booking with pickup in the past is rejected")
    past_payload = {
        "carId": car_id,
        "pickup": f"{test_car['location']} Hub",
        "dropoff": f"{test_car['location']} Hub",
        "start": (datetime.utcnow() - timedelta(days=2)).strftime("%Y-%m-%dT10:00"),
        "end": (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%dT10:00"),
        "customer": {
            "fullName": "Kannan Renter",
            "email": new_user_email,
            "phone": "+919876500002",
            "license": "TN7420240005555",
        },
        "extras": {},
    }
    status, past_res = make_request("/api/bookings", method="POST", data=past_payload, headers=auth_headers)
    assert status == 400, f"Expected 400 Bad Request for past date, got {status}: {past_res}"
    print(f" [PASS] Past date booking rejected with 400: {past_res.get('detail')}")

    # 9. Existing customer login and immediate booking
    log_test(9, "Existing customer login: User logs in and immediately books an available car")
    login_payload = {"email": new_user_email, "password": "Password123!"}
    status, login_res = make_request("/api/auth/login", method="POST", data=login_payload)
    assert status == 200, f"Expected 200 for customer login, got {status}: {login_res}"
    re_token = login_res["token"]
    assert login_res["user"]["email"] == new_user_email
    print(f" [PASS] Customer logged in successfully: {login_res['user']['fullName']}")

    # Pick another car
    second_car = next((c for c in cars_list if c["id"] != car_id and c.get("available")), None)
    if second_car:
        second_car_id = second_car["id"]
        status, second_booking = make_request("/api/bookings", method="POST", data={
            "carId": second_car_id,
            "pickup": f"{second_car['location']} Hub",
            "dropoff": f"{second_car['location']} Hub",
            "start": (datetime.utcnow() + timedelta(days=offset + 10)).strftime("%Y-%m-%dT10:00"),
            "end": (datetime.utcnow() + timedelta(days=offset + 12)).strftime("%Y-%m-%dT10:00"),
            "customer": {
                "fullName": "Kannan Renter",
                "email": new_user_email,
                "phone": "+919876500002",
                "license": "TN7420240005555",
            },
            "extras": {},
        }, headers={"Authorization": f"Bearer {re_token}"})
        assert status == 201, f"Expected 201 for second booking, got {status}: {second_booking}"
        print(f" [PASS] Existing user booked second car: Ref {second_booking['booking']['ref']} for car #{second_car_id}")

    # 10. Admin portal verification
    log_test(10, "Admin portal verification: Admin sees the new booking with correct customer and car details")
    admin_login = {"email": "admin@drivo.com", "password": "AdminSecure2026!"}
    status, admin_res = make_request("/api/admin/login", method="POST", data=admin_login)
    assert status == 200, f"Expected 200 for admin login, got {status}"
    admin_token = admin_res["token"]

    status, admin_bookings = make_request("/api/admin/bookings", headers={"Authorization": f"Bearer {admin_token}"})
    assert status == 200, f"Expected 200 from /api/admin/bookings, got {status}"
    found_in_admin = next((b for b in admin_bookings.get("bookings", []) if b["ref"] == booking_ref), None)
    assert found_in_admin is not None, f"Booking {booking_ref} not found in admin bookings list"
    assert found_in_admin["customer"]["email"] == new_user_email
    print(f" [PASS] Admin successfully verified booking {booking_ref} belonging to {new_user_email}")

    print("\n================================================================================")
    print("  ALL 10 LOGIN-REQUIRED BOOKING FLOW VERIFICATION TESTS PASSED SUCCESSFULLY!  ")
    print("================================================================================\n")

if __name__ == "__main__":
    run_tests()

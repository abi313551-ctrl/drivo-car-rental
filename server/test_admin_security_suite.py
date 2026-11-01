import sys
import os
import time

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from fastapi.testclient import TestClient
from main import app
from database import get_db
from models import User, Car, Booking, Payment
from auth import hash_password

client = TestClient(app)

def run_tests():
    print("==================================================")
    print("   DRIVO ADMIN SECURITY COMPREHENSIVE TEST SUITE  ")
    print("==================================================")
    
    db = next(get_db())
    
    # 1. Setup a test customer and test admin
    cust_email = f"security_cust_{int(time.time())}@example.com"
    cust_pw = "CustomerPass123!"
    cust_user = User(
        full_name="Security Customer",
        email=cust_email,
        phone="9876543210",
        license_number="TN74-CUST-999",
        password_hash=hash_password(cust_pw),
        role="customer",
    )
    db.add(cust_user)
    
    adm_email = f"security_adm_{int(time.time())}@example.com"
    adm_pw = "AdminPass123!"
    adm_user = User(
        full_name="Security Administrator",
        email=adm_email,
        phone="9876543211",
        license_number="TN74-ADM-999",
        password_hash=hash_password(adm_pw),
        role="admin",
    )
    db.add(adm_user)
    db.commit()
    
    print("\n[TEST 1] Customer Normal Login")
    res_cust_login = client.post("/api/auth/login", json={"email": cust_email, "password": cust_pw})
    assert res_cust_login.status_code == 200, f"Expected 200, got {res_cust_login.status_code}: {res_cust_login.text}"
    cust_token = res_cust_login.json()["token"]
    assert res_cust_login.json()["user"]["role"] == "customer"
    print("  [PASS] Customer login succeeded with token and role='customer'")
    
    print("\n[TEST 2] Customer Attempting Admin Login")
    res_cust_as_admin = client.post("/api/admin/login", json={"email": cust_email, "password": cust_pw})
    assert res_cust_as_admin.status_code == 403, f"Expected 403 Forbidden, got {res_cust_as_admin.status_code}: {res_cust_as_admin.text}"
    print(f"  [PASS] Non-admin customer correctly rejected with 403: {res_cust_as_admin.json()['detail']}")
    
    print("\n[TEST 3] Admin Login with Invalid Password")
    res_adm_bad_pw = client.post("/api/admin/login", json={"email": adm_email, "password": "WrongPassword!"})
    assert res_adm_bad_pw.status_code == 401, f"Expected 401 Unauthorized, got {res_adm_bad_pw.status_code}: {res_adm_bad_pw.text}"
    print(f"  [PASS] Invalid password correctly rejected with 401: {res_adm_bad_pw.json()['detail']}")
    
    print("\n[TEST 4] Admin Login with Valid Credentials")
    res_adm_login = client.post("/api/admin/login", json={"email": adm_email, "password": adm_pw})
    assert res_adm_login.status_code == 200, f"Expected 200, got {res_adm_login.status_code}: {res_adm_login.text}"
    adm_token = res_adm_login.json()["token"]
    assert res_adm_login.json()["user"]["role"] == "admin"
    print("  [PASS] Admin login succeeded with token and role='admin'")
    
    print("\n[TEST 5] Customer Token Attempting Admin APIs (RBAC Protection)")
    endpoints = [
        ("GET", "/api/admin/stats"),
        ("GET", "/api/admin/bookings"),
        ("GET", "/api/admin/customers"),
        ("GET", "/api/admin/payments"),
        ("GET", "/api/admin/cars"),
    ]
    for method, path in endpoints:
        if method == "GET":
            res = client.get(path, headers={"Authorization": f"Bearer {cust_token}"})
        assert res.status_code == 403, f"Expected 403 Forbidden for {path}, got {res.status_code}: {res.text}"
        print(f"  [PASS] Customer access to {path} blocked: 403 Forbidden")
        
    print("\n[TEST 6] Unauthenticated Visitor Attempting Admin APIs")
    for method, path in endpoints:
        res = client.get(path)
        assert res.status_code == 401, f"Expected 401 Unauthorized for {path}, got {res.status_code}: {res.text}"
        print(f"  [PASS] Unauthenticated access to {path} blocked: 401 Unauthorized")
        
    print("\n[TEST 7] Authorized Admin Access to Admin APIs")
    res_stats = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {adm_token}"})
    assert res_stats.status_code == 200, f"Expected 200 for /api/admin/stats, got {res_stats.status_code}: {res_stats.text}"
    print(f"  [PASS] Admin /api/admin/stats accessible. Total revenue reported: {res_stats.json().get('totalRevenue')}")
    
    res_bookings = client.get("/api/admin/bookings", headers={"Authorization": f"Bearer {adm_token}"})
    assert res_bookings.status_code == 200, f"Expected 200 for /api/admin/bookings, got {res_bookings.status_code}: {res_bookings.text}"
    print(f"  [PASS] Admin /api/admin/bookings accessible. Bookings count: {len(res_bookings.json().get('bookings', []))}")

    print("\n[TEST 8] Public Cars Listing Endpoint Integrity")
    res_cars = client.get("/api/cars")
    assert res_cars.status_code == 200, f"Expected 200 for /api/cars, got {res_cars.status_code}: {res_cars.text}"
    cars_data = res_cars.json()
    assert len(cars_data) > 0, "Expected at least 1 car"
    print(f"  [PASS] /api/cars returned {len(cars_data)} vehicles successfully.")

    print("\n[TEST 9] Customer Booking & Razorpay Flow Integrity")
    car = db.query(Car).filter(Car.available == True).first()
    assert car is not None, "A car is required for booking test"
    
    booking_payload = {
        "carId": car.id,
        "pickup": "Nagercoil Junction Railway Station",
        "dropoff": "Nagercoil Junction Railway Station",
        "start": f"2029-{(int(time.time()) % 12) + 1:02d}-01T10:00:00Z",
        "end": f"2029-{(int(time.time()) % 12) + 1:02d}-04T10:00:00Z",
        "customer": {
            "fullName": "Security Customer",
            "email": cust_email,
            "phone": "9876543210",
            "city": "Nagercoil",
            "license": "TN37 20190012345",
            "licenseNumber": "TN37 20190012345",
        },
        "extras": {},
        "redeemPoints": 0,
    }
    res_booking = client.post("/api/bookings", json=booking_payload, headers={"Authorization": f"Bearer {cust_token}"})
    assert res_booking.status_code in (200, 201), f"Expected 200/201, got {res_booking.status_code}: {res_booking.text}"
    booking_ref = res_booking.json()["booking"]["ref"]
    print(f"  [PASS] Booking created successfully: ref={booking_ref}")
    
    # Test Razorpay payment configuration
    res_cfg = client.get("/api/payments/config")
    assert res_cfg.status_code == 200, f"Expected 200 for payments config, got {res_cfg.status_code}"
    print(f"  [PASS] /api/payments/config returned gateway: {res_cfg.json().get('gateway')}")

    # Test Razorpay order creation and verification flow
    from unittest.mock import patch
    with patch("main.is_razorpay_configured", return_value=True), \
         patch("main.create_gateway_order", return_value={"id": "order_test_12345", "amount": 640000}), \
         patch("main.verify_gateway_signature", return_value=True):
        
        res_rp_order = client.post("/api/payments/create-order", json={"bookingRef": booking_ref}, headers={"Authorization": f"Bearer {cust_token}"})
        assert res_rp_order.status_code == 200, f"Expected 200 for Razorpay order, got {res_rp_order.status_code}: {res_rp_order.text}"
        order_data = res_rp_order.json()
        assert "orderId" in order_data or "id" in order_data, f"Order id missing in {order_data}"
        order_id = order_data.get("orderId") or order_data.get("id")
        print(f"  [PASS] Razorpay order generated successfully: order_id={order_id}")
        
        # Test Razorpay payment verification
        verify_payload = {
            "bookingRef": booking_ref,
            "razorpayPaymentId": f"pay_test_{int(time.time())}",
            "razorpayOrderId": order_id,
            "razorpaySignature": "mock_signature_for_test",
        }
        res_verify = client.post("/api/payments/verify", json=verify_payload, headers={"Authorization": f"Bearer {cust_token}"})
        assert res_verify.status_code == 200, f"Expected 200 for payment verify, got {res_verify.status_code}: {res_verify.text}"
        print(f"  [PASS] Payment verification succeeded: {res_verify.json().get('status', 'confirmed')}")

    print("\n==================================================")
    print("   ALL 9 BACKEND & SECURITY TESTS PASSED 100%!    ")
    print("==================================================")

if __name__ == "__main__":
    run_tests()

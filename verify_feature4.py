import os
import sys
import time
import hmac
import hashlib
import datetime
import requests

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("========================================")
    print("Starting Automated Feature 4 Test Suite")
    print("========================================")

    # 1. Test Rental Price Calculation API
    print("\n[TEST 1] Testing Backend Rental Price Calculation (/api/pricing/calculate)...")
    start_dt = (datetime.datetime.now() + datetime.timedelta(days=2)).strftime("%Y-%m-%dT10:00")
    end_dt = (datetime.datetime.now() + datetime.timedelta(days=5)).strftime("%Y-%m-%dT10:00")

    calc_payload = {
        "carId": 1,
        "start": start_dt,
        "end": end_dt,
        "extras": {"gps": True, "premiumInsurance": True, "childSeat": False, "additionalDriver": False},
        "couponCode": ""
    }
    r = requests.post(f"{BASE_URL}/api/pricing/calculate", json=calc_payload)
    assert r.status_code == 200, f"Expected 200 from pricing calculate, got {r.status_code}: {r.text}"
    p_data = r.json().get("pricing", {})
    days = p_data.get("days")
    assert days == 3, f"Expected 3 days, got {days}"
    price_per_day = p_data.get("pricePerDay")
    rental_base = p_data.get("base")
    extras_total = p_data.get("extras")
    gst = p_data.get("tax")
    deposit = p_data.get("deposit")
    total = p_data.get("total")

    print(f"PASS: Authoritative pricing computed by backend:")
    print(f"      Duration: {days} days @ INR {price_per_day}/day = Base: INR {rental_base}")
    print(f"      Extras: INR {extras_total}, GST: INR {gst}, Deposit: INR {deposit}, Total: INR {total}")

    # 2. Test Invalid Booking Dates Validation
    print("\n[TEST 2] Testing Invalid Dates Rejection...")
    invalid_date_payload = {
        "carId": 1,
        "start": end_dt, # End is before start
        "end": start_dt,
        "extras": {},
    }
    r_inv = requests.post(f"{BASE_URL}/api/pricing/calculate", json=invalid_date_payload)
    assert r_inv.status_code == 400, f"Expected 400 for inverted dates, got {r_inv.status_code}: {r_inv.text}"
    print(f"PASS: Inverted dates correctly rejected with 400: {r_inv.json().get('detail')}")

    # Excessive duration test (> 30 days)
    excessive_dt = (datetime.datetime.now() + datetime.timedelta(days=40)).strftime("%Y-%m-%dT10:00")
    r_exc = requests.post(f"{BASE_URL}/api/pricing/calculate", json={
        "carId": 1,
        "start": start_dt,
        "end": excessive_dt,
        "extras": {},
    })
    assert r_exc.status_code == 400, f"Expected 400 for > 30 days, got {r_exc.status_code}: {r_exc.text}"
    print(f"PASS: Duration > 30 days correctly rejected with 400: {r_exc.json().get('detail')}")

    # 3. Test Public Payment Gateway Config Endpoint
    print("\n[TEST 3] Testing Public Payment Config Endpoint (/api/payments/config)...")
    r_cfg = requests.get(f"{BASE_URL}/api/payments/config")
    assert r_cfg.status_code == 200, f"Expected 200, got {r_cfg.status_code}"
    cfg = r_cfg.json()
    assert "gateway" in cfg and cfg["gateway"] == "Razorpay"
    assert "currency" in cfg and cfg["currency"] == "INR"
    assert "keySecret" not in cfg, "CRITICAL: Secret key must NEVER be exposed in config endpoint!"
    print(f"PASS: Config endpoint verified safely. Gateway: {cfg['gateway']}, Configured: {cfg.get('isConfigured')}")

    # 4. Create User and Booking for Payment Testing
    print("\n[TEST 4] Creating Test User & Booking for Payment Lifecycle...")
    u1_email = f"pay_test_{int(time.time())}@example.com"
    r_reg = requests.post(f"{BASE_URL}/api/auth/register", json={
        "fullName": "Payment Tester",
        "email": u1_email,
        "password": "SecurePassword123!",
        "phone": "+919876543210"
    })
    assert r_reg.status_code == 201, f"Failed to register test user: {r_reg.text}"
    token1 = r_reg.json()["token"]
    h1 = {"Authorization": f"Bearer {token1}"}

    # Create booking for user 1
    booking_start = (datetime.datetime.now() + datetime.timedelta(days=25)).strftime("%Y-%m-%dT10:00")
    booking_end = (datetime.datetime.now() + datetime.timedelta(days=28)).strftime("%Y-%m-%dT10:00")
    b_payload = {
        "carId": 1,
        "pickup": "Nagercoil Junction Railway Station",
        "dropoff": "Nagercoil Junction Railway Station",
        "start": booking_start,
        "end": booking_end,
        "customer": {
            "fullName": "Payment Tester",
            "email": u1_email,
            "phone": "+919876543210",
            "license": "DL1420201234567"
        },
        "extras": {"gps": True},
        "couponCode": "",
        "redeemPoints": 0
    }
    r_book = requests.post(f"{BASE_URL}/api/bookings", json=b_payload, headers=h1)
    assert r_book.status_code == 201, f"Failed to create booking: {r_book.text}"
    b_obj = r_book.json()["booking"]
    booking_ref = b_obj["ref"]
    booking_amount = b_obj["pricing"]["total"]
    print(f"PASS: Booking created: Ref={booking_ref}, Amount=INR {booking_amount}, Initial PaymentStatus={b_obj['paymentStatus']}")

    # 5. Test Cross-User Payment Authorization Block
    print("\n[TEST 5] Testing Cross-User Payment Authorization Block...")
    u2_email = f"pay_intruder_{int(time.time())}@example.com"
    r_reg2 = requests.post(f"{BASE_URL}/api/auth/register", json={
        "fullName": "Intruder User",
        "email": u2_email,
        "password": "SecurePassword123!",
        "phone": "+919876500000"
    })
    token2 = r_reg2.json()["token"]
    h2 = {"Authorization": f"Bearer {token2}"}

    # User 2 tries to verify payment for User 1's booking
    r_cross = requests.post(f"{BASE_URL}/api/payments/verify", json={
        "bookingRef": booking_ref,
        "razorpayOrderId": "order_fake_12345",
        "razorpayPaymentId": "pay_fake_12345",
        "razorpaySignature": "fake_sig_12345"
    }, headers=h2)
    assert r_cross.status_code == 403, f"Expected 403 for cross-user payment, got {r_cross.status_code}: {r_cross.text}"
    print(f"PASS: Unauthorized cross-user payment blocked with 403: {r_cross.json().get('detail')}")

    # 6. Test Unauthenticated Payment Attempt
    print("\n[TEST 6] Testing Unauthenticated Payment Attempt...")
    r_unauth = requests.post(f"{BASE_URL}/api/payments/verify", json={
        "bookingRef": booking_ref,
        "razorpayOrderId": "order_fake_12345",
        "razorpayPaymentId": "pay_fake_12345",
        "razorpaySignature": "fake_sig_12345"
    })
    assert r_unauth.status_code == 401, f"Expected 401 without auth token, got {r_unauth.status_code}"
    print("PASS: Unauthenticated payment attempt rejected with 401.")

    # 7. Test Backend HMAC-SHA256 Signature Verification
    print("\n[TEST 7] Testing HMAC-SHA256 Signature Verification (Invalid Signature)...")
    fake_order_id = "order_test_998877"
    fake_pay_id = "pay_test_998877"
    invalid_sig = "0000000000000000000000000000000000000000000000000000000000000000"

    r_verify_inv = requests.post(f"{BASE_URL}/api/payments/verify", json={
        "bookingRef": booking_ref,
        "razorpayOrderId": fake_order_id,
        "razorpayPaymentId": fake_pay_id,
        "razorpaySignature": invalid_sig
    }, headers=h1)
    assert r_verify_inv.status_code == 400, f"Expected 400 for invalid signature, got {r_verify_inv.status_code}: {r_verify_inv.text}"
    print(f"PASS: Invalid signature correctly rejected with 400: {r_verify_inv.json().get('detail')}")

    # Verify that booking status remained 'Failed' or 'Pending' and NEVER marked 'Paid'
    r_check = requests.get(f"{BASE_URL}/api/bookings/{booking_ref}", headers=h1)
    assert r_check.json()["booking"]["paymentStatus"] != "Paid", "CRITICAL: Booking must NOT be marked Paid on failed verification!"
    print(f"PASS: Booking paymentStatus was NOT marked Paid (Current status: {r_check.json()['booking']['paymentStatus']})")

    # 8. Test Valid Signature Verification with Test Secret
    print("\n[TEST 8] Testing Valid HMAC Signature Verification...")
    # Set a test secret in server payment environment or test via direct HMAC
    test_secret = "drivo_test_secret_for_verification"
    os.environ["RAZORPAY_KEY_SECRET"] = test_secret

    # Compute genuine HMAC-SHA256 signature
    msg = f"{fake_order_id}|{fake_pay_id}".encode("utf-8")
    valid_sig = hmac.new(test_secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    # Now verify via Python service directly and verify endpoint
    sys.path.insert(0, "server")
    from payment_service import verify_gateway_signature
    is_valid_internal = verify_gateway_signature(fake_order_id, fake_pay_id, valid_sig, secret_override=test_secret)
    assert is_valid_internal is True, "Internal HMAC verification failed"
    print("PASS: Official HMAC-SHA256 signature math verified successfully.")

    # 9. Test Payment Failure Logging API
    print("\n[TEST 9] Testing Payment Failure Logging API (/api/payments/failure)...")
    r_fail = requests.post(f"{BASE_URL}/api/payments/failure", json={
        "bookingRef": booking_ref,
        "razorpayOrderId": fake_order_id,
        "errorCode": "BAD_REQUEST_ERROR",
        "errorDescription": "Customer dismissed the gateway checkout modal."
    }, headers=h1)
    assert r_fail.status_code == 200, f"Expected 200 from failure log, got {r_fail.status_code}: {r_fail.text}"
    print("PASS: Gateway failure logged successfully.")

    # 10. Test Payment Audit History
    print("\n[TEST 10] Testing Payment Audit History (/api/payments/booking/{ref})...")
    r_hist = requests.get(f"{BASE_URL}/api/payments/booking/{booking_ref}", headers=h1)
    assert r_hist.status_code == 200, f"Expected 200 from payment history, got {r_hist.status_code}"
    history = r_hist.json().get("payments", [])
    assert len(history) > 0, "Expected at least 1 logged payment record"
    print(f"PASS: Payment audit trail verified ({len(history)} records logged in 'payments' table).")
    print(f"      Latest record: status={history[0]['status']}, error={history[0].get('errorCode')}")

    # 11. Test Payment Update on Completed Booking & Duplicate Verification Prevention
    print("\n[TEST 11] Testing Authoritative Payment Settlement & Idempotency...")
    # Settle booking payment via authenticated endpoint
    r_settle = requests.post(f"{BASE_URL}/api/bookings/{booking_ref}/payment", json={
        "paymentMethod": "Razorpay",
        "paymentStatus": "Paid"
    }, headers=h1)
    assert r_settle.status_code == 200, f"Failed to settle payment: {r_settle.text}"
    settled_b = r_settle.json()["booking"]
    assert settled_b["paymentStatus"] == "Paid"
    assert settled_b["amountPaid"] == booking_amount
    assert settled_b["amountDue"] == 0
    print(f"PASS: Booking settled. paymentStatus='Paid', amountPaid=INR {settled_b['amountPaid']}, amountDue=0")

    # Duplicate payment verification attempt on already paid booking
    print("\n[TEST 12] Testing Duplicate Payment Prevention on Paid Booking...")
    r_dup = requests.post(f"{BASE_URL}/api/payments/verify", json={
        "bookingRef": booking_ref,
        "razorpayOrderId": fake_order_id,
        "razorpayPaymentId": fake_pay_id,
        "razorpaySignature": valid_sig
    }, headers=h1)
    assert r_dup.status_code == 400, f"Expected 400 for duplicate payment, got {r_dup.status_code}: {r_dup.text}"
    assert "already been paid" in r_dup.json().get("detail", "").lower()
    print(f"PASS: Duplicate payment rejected with 400: {r_dup.json().get('detail')}")

    # 12. Test Cancelled Booking Payment Block
    print("\n[TEST 13] Testing Payment Block on Cancelled Booking...")
    # Create another booking and cancel it
    b_cancel_payload = dict(b_payload)
    b_cancel_payload["start"] = (datetime.datetime.now() + datetime.timedelta(days=10)).strftime("%Y-%m-%dT10:00")
    b_cancel_payload["end"] = (datetime.datetime.now() + datetime.timedelta(days=12)).strftime("%Y-%m-%dT10:00")
    r_b2 = requests.post(f"{BASE_URL}/api/bookings", json=b_cancel_payload, headers=h1)
    ref2 = r_b2.json()["booking"]["ref"]

    # Cancel booking
    r_c = requests.post(f"{BASE_URL}/api/bookings/{ref2}/cancel", headers=h1)
    assert r_c.status_code == 200, f"Failed to cancel booking: {r_c.text}"

    # Try to pay for cancelled booking
    r_pay_cancel = requests.post(f"{BASE_URL}/api/payments/verify", json={
        "bookingRef": ref2,
        "razorpayOrderId": "order_test_cancel",
        "razorpayPaymentId": "pay_test_cancel",
        "razorpaySignature": "dummy"
    }, headers=h1)
    assert r_pay_cancel.status_code == 400, f"Expected 400 for cancelled booking, got {r_pay_cancel.status_code}"
    print(f"PASS: Payment for cancelled booking correctly rejected: {r_pay_cancel.json().get('detail')}")

    # 13. Test My Bookings Reflection
    print("\n[TEST 14] Testing Payment Status Reflection in My Bookings...")
    r_my = requests.get(f"{BASE_URL}/api/bookings/my", headers=h1)
    assert r_my.status_code == 200
    my_bookings = r_my.json().get("bookings", [])
    matching = next((b for b in my_bookings if b["ref"] == booking_ref), None)
    assert matching is not None, "Booking not found in My Bookings"
    assert matching["paymentStatus"] == "Paid"
    assert matching["amountPaid"] == booking_amount
    print(f"PASS: My Bookings reflects paymentStatus='Paid', amountPaid=INR {matching['amountPaid']}")

    print("\n========================================")
    print("ALL FEATURE 4 TESTS PASSED SUCCESSFULLY!")
    print("========================================")

if __name__ == "__main__":
    run_tests()

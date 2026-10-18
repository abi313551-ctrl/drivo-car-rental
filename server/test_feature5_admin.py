import io
import sys
import requests

# Ensure utf-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("========================================")
    print("FEATURE 5: ADMIN DASHBOARD & RBAC TESTS")
    print("========================================")

    # 1. Test Unauthenticated Access
    print("\n[Test 1] Unauthenticated request to /api/admin/stats...")
    r = requests.get(f"{BASE_URL}/api/admin/stats")
    assert r.status_code == 401, f"Expected 401, got {r.status_code}"
    print("[OK] PASSED: Unauthenticated access blocked with 401.")

    # 2. Test Customer / Non-admin Access
    print("\n[Test 2] Customer (non-admin) access to /api/admin/stats...")
    customer_email = "rbac_customer_test@drivo.com"
    requests.post(f"{BASE_URL}/api/auth/register", json={
        "fullName": "RBAC Customer Tester",
        "email": customer_email,
        "password": "Password123!",
        "phone": "+1234567890",
        "license": "DL12345678"
    })
    
    login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": customer_email,
        "password": "Password123!"
    })
    assert login_res.status_code == 200, f"Customer login failed: {login_res.text}"
    customer_token = login_res.json()["token"]

    cust_headers = {"Authorization": f"Bearer {customer_token}"}
    r = requests.get(f"{BASE_URL}/api/admin/stats", headers=cust_headers)
    assert r.status_code == 403, f"Expected 403 Forbidden for customer, got {r.status_code}: {r.text}"
    print("[OK] PASSED: Customer access to admin stats strictly blocked with 403 Forbidden.")

    r = requests.get(f"{BASE_URL}/api/admin/bookings", headers=cust_headers)
    assert r.status_code == 403, f"Expected 403 Forbidden for customer, got {r.status_code}: {r.text}"
    print("[OK] PASSED: Customer access to admin bookings strictly blocked with 403 Forbidden.")

    # 3. Test Admin Login
    print("\n[Test 3] Admin authentication...")
    admin_login = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@drivo.com",
        "password": "AdminSecure2026!"
    })
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_data = admin_login.json()
    assert admin_data["user"]["role"] == "admin", f"User role is not admin: {admin_data['user']}"
    admin_token = admin_data["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(f"[OK] PASSED: Admin authenticated successfully as {admin_data['user']['email']}.")

    # 4. Test Admin Overview Stats
    print("\n[Test 4] Fetching admin dashboard stats (/api/admin/stats)...")
    stats_res = requests.get(f"{BASE_URL}/api/admin/stats", headers=admin_headers)
    assert stats_res.status_code == 200, f"Failed to get admin stats: {stats_res.text}"
    stats = stats_res.json()
    print("Admin stats response:", stats)
    required_keys = [
        "totalUsers", "totalCars", "availableCars", "totalBookings",
        "pendingBookings", "confirmedBookings", "completedBookings", "verifiedPaymentsTotal"
    ]
    for key in required_keys:
        assert key in stats, f"Missing metric key: {key}"
    print(f"[OK] PASSED: All 8 required metrics present:")
    for k in required_keys:
        print(f"   - {k}: {stats[k]}")

    # 5. Test Car Management
    print("\n[Test 5] Car Management CRUD & Validation...")
    new_car_payload = {
        "brand": "Genesis",
        "model": "G90 Luxury",
        "year": 2026,
        "category": "Luxury",
        "fuel": "Petrol",
        "transmission": "Automatic",
        "seats": 5,
        "pricePerDay": 8500,
        "deposit": 15000,
        "location": "Nagercoil",
        "image": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
        "available": True,
        "description": "Executive luxury sedan with premier amenities."
    }
    car_create_res = requests.post(f"{BASE_URL}/api/cars", json=new_car_payload, headers=admin_headers)
    assert car_create_res.status_code in [200, 201], f"Car creation failed: {car_create_res.text}"
    created_car = car_create_res.json()["car"]
    car_id = created_car["id"]
    print(f"[OK] PASSED: Successfully created car ID {car_id} ({created_car['brand']} {created_car['model']}).")

    # Update car details
    update_res = requests.put(f"{BASE_URL}/api/cars/{car_id}", json={
        "brand": "Genesis",
        "model": "G90 Executive Edition",
        "year": 2026,
        "category": "Luxury",
        "fuel": "Petrol",
        "transmission": "Automatic",
        "seats": 5,
        "pricePerDay": 9200,
        "deposit": 15000,
        "location": "Nagercoil",
        "image": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
        "available": False,
        "description": "Executive luxury sedan with premier amenities and personal chauffeur option."
    }, headers=admin_headers)
    assert update_res.status_code == 200, f"Car update failed: {update_res.text}"
    updated_car = update_res.json()["car"]
    assert updated_car["pricePerDay"] == 9200 and updated_car["available"] is False
    print("[OK] PASSED: Successfully updated car price and availability status.")

    # Re-enable car availability
    requests.put(f"{BASE_URL}/api/cars/{car_id}", json={
        **new_car_payload,
        "available": True
    }, headers=admin_headers)

    # 6. Test Booking Creation, Status Updates & Payment Constraint
    print("\n[Test 6] Booking workflow & Status management...")
    book_res = requests.post(f"{BASE_URL}/api/bookings", json={
        "carId": car_id,
        "pickup": "Nagercoil Junction Railway Station",
        "dropoff": "Nagercoil Junction Railway Station",
        "start": "2026-11-20T10:00",
        "end": "2026-11-25T10:00",
        "customer": {
            "fullName": "RBAC Customer Tester",
            "email": customer_email,
            "phone": "+919876543210",
            "license": "MH0120200001234"
        },
        "extras": {
            "insurance": True,
            "gps": False,
            "childSeat": False
        }
    }, headers=cust_headers)
    assert book_res.status_code in [200, 201], f"Booking creation failed: {book_res.text}"
    booking = book_res.json()["booking"]
    booking_id = booking["id"]
    print(f"[OK] Created booking ID {booking_id} with status: {booking.get('status')}, payment: {booking.get('paymentStatus')}")

    # 7. Safe Deletion Test: Admin attempts to delete car with active booking
    print("\n[Test 7] Safe Deletion Check: Attempt delete car with active booking...")
    del_res = requests.delete(f"{BASE_URL}/api/cars/{car_id}", headers=admin_headers)
    assert del_res.status_code == 400, f"Expected 400 Bad Request when deleting car with active booking, got {del_res.status_code}: {del_res.text}"
    print(f"[OK] PASSED: Car deletion safely blocked ({del_res.json().get('detail')}).")

    # 8. Admin Booking Status Management
    print("\n[Test 8] Admin confirms pending booking...")
    confirm_res = requests.patch(
        f"{BASE_URL}/api/admin/bookings/{booking_id}/status",
        json={"status": "Confirmed"},
        headers=admin_headers
    )
    assert confirm_res.status_code == 200, f"Failed to confirm booking: {confirm_res.text}"
    assert confirm_res.json()["booking"]["status"] == "Confirmed"
    print("[OK] PASSED: Admin confirmed booking.")

    # 9. Strict Constraint: Admin CANNOT manually mark unpaid booking as Paid
    print("\n[Test 9] Constraint verification: Admin cannot manually mark unpaid booking as Paid...")
    illegal_pay_res = requests.patch(
        f"{BASE_URL}/api/admin/bookings/{booking_id}/status",
        json={"status": "Confirmed", "paymentStatus": "Paid"},
        headers=admin_headers
    )
    assert illegal_pay_res.status_code == 400, f"Expected 400 Bad Request for manual Paid status, got {illegal_pay_res.status_code}: {illegal_pay_res.text}"
    print(f"[OK] PASSED: System strictly blocked manual payment marking: {illegal_pay_res.json().get('detail')}")

    # 10. Admin completes trip
    print("\n[Test 10] Admin completes trip...")
    complete_res = requests.patch(
        f"{BASE_URL}/api/admin/bookings/{booking_id}/status",
        json={"status": "Completed"},
        headers=admin_headers
    )
    assert complete_res.status_code == 200, f"Failed to complete booking: {complete_res.text}"
    assert complete_res.json()["booking"]["status"] == "Completed"
    print("[OK] PASSED: Booking status transitioned to Completed.")

    # 11. Admin cancels booking
    print("\n[Test 11] Admin cancels booking...")
    cancel_res = requests.patch(
        f"{BASE_URL}/api/admin/bookings/{booking_id}/status",
        json={"status": "Cancelled"},
        headers=admin_headers
    )
    assert cancel_res.status_code == 200, f"Failed to cancel booking: {cancel_res.text}"
    assert cancel_res.json()["booking"]["status"] == "Cancelled"
    print("[OK] PASSED: Booking cancelled successfully.")

    # 12. Deletion/Deactivation of car with historical bookings
    print("\n[Test 12] Safe deactivation for car with historical bookings...")
    del_historical_res = requests.delete(f"{BASE_URL}/api/cars/{car_id}", headers=admin_headers)
    assert del_historical_res.status_code == 200, f"Failed to safely deactivate car: {del_historical_res.text}"
    print(f"[OK] PASSED: Safe deactivation performed: {del_historical_res.json().get('message')}")

    print("\n========================================")
    print("ALL FEATURE 5 TESTS COMPLETED SUCCESSFULLY! [PASSED]")
    print("========================================")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n[FAIL] TEST FAILED: {e}")
        sys.exit(1)

import io
import sys
import requests

# Ensure utf-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=" * 60)
    print("KANNIYAKUMARI DISTRICT SERVICE AREA & RESTRICTION TESTS")
    print("=" * 60)

    # 1. Test /api/locations metadata and Kanniyakumari exclusivity
    print("\n[Test 1] Testing /api/locations endpoint...")
    r = requests.get(f"{BASE_URL}/api/locations")
    assert r.status_code == 200, f"Failed: {r.text}"
    data = r.json()
    assert data["district"] == "Kanniyakumari", f"Expected Kanniyakumari, got {data.get('district')}"
    assert "Kanniyakumari" in data["serviceArea"]
    assert "Currently serving Kanniyakumari district only." in data["message"]
    assert data["count"] > 0
    print(f"[OK] PASSED: /api/locations returns {data['count']} verified Kanniyakumari stations.")
    print(f"     Service Area: {data['serviceArea']}")
    print(f"     Notice: {data['message']}")

    # 2. Test /api/locations/check
    print("\n[Test 2] Testing /api/locations/check endpoint...")
    valid_test_cases = ["Nagercoil", "Nagercoil Junction Railway Station", "Kanyakumari", "Marthandam", "Thuckalay", "Colachel", "Kuzhithurai"]
    invalid_test_cases = ["Chennai", "Chennai Airport", "Bengaluru", "Mumbai", "Coimbatore", "Delhi", "Kochi", "Hyderabad"]

    for loc in valid_test_cases:
        res = requests.get(f"{BASE_URL}/api/locations/check", params={"location": loc})
        assert res.status_code == 200
        assert res.json()["supported"] is True, f"Expected {loc} to be supported!"
    print(f"[OK] PASSED: All {len(valid_test_cases)} Kanniyakumari locations validated as supported.")

    for loc in invalid_test_cases:
        res = requests.get(f"{BASE_URL}/api/locations/check", params={"location": loc})
        assert res.status_code == 200
        assert res.json()["supported"] is False, f"Expected {loc} to be rejected!"
        assert "Sorry, Drivo currently provides car rental services only within Kanniyakumari district." in res.json()["message"]
    print(f"[OK] PASSED: All {len(invalid_test_cases)} outside locations correctly flagged as unsupported.")

    # 3. Authenticate customer
    print("\n[Test 3] Authenticating test customer...")
    customer_email = "kanya_tester@drivo.com"
    requests.post(f"{BASE_URL}/api/auth/register", json={
        "fullName": "Kanniyakumari Tester",
        "email": customer_email,
        "password": "Password123!",
        "phone": "+919876543210",
        "license": "TN7420220001234"
    })
    login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": customer_email,
        "password": "Password123!"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    cust_token = login_res.json()["token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    print("[OK] PASSED: Customer authenticated.")

    # 4. Find cars in different Kanniyakumari hubs
    print("\n[Test 4] Querying cars fleet by Kanniyakumari hub...")
    cars_res = requests.get(f"{BASE_URL}/api/cars")
    assert cars_res.status_code == 200
    all_cars = cars_res.json()["cars"]
    assert len(all_cars) > 0
    # Pick a car in Nagercoil and a car in Marthandam
    nagercoil_car = next((c for c in all_cars if c["location"] == "Nagercoil"), None)
    marthandam_car = next((c for c in all_cars if c["location"] == "Marthandam"), None)
    assert nagercoil_car is not None, "No car found stationed in Nagercoil"
    print(f"[OK] Found car ID {nagercoil_car['id']} ({nagercoil_car['brand']} {nagercoil_car['model']}) at {nagercoil_car['location']} Hub.")

    # 5. Direct API Test: Attempt booking with UNSUPPORTED pickup location (e.g. Chennai)
    print("\n[Test 5] Direct API: Attempt booking with outside pickup location ('Chennai Airport')...")
    bad_pickup_res = requests.post(f"{BASE_URL}/api/bookings", json={
        "carId": nagercoil_car["id"],
        "pickup": "Chennai Airport",
        "dropoff": "Nagercoil Junction Railway Station",
        "start": "2026-11-20T10:00",
        "end": "2026-11-22T10:00",
        "customer": {
            "fullName": "Kanniyakumari Tester",
            "email": customer_email,
            "phone": "+919876543210",
            "license": "TN7420220001234"
        }
    }, headers=cust_headers)
    assert bad_pickup_res.status_code == 400, f"Expected 400, got {bad_pickup_res.status_code}: {bad_pickup_res.text}"
    assert "Sorry, Drivo currently provides car rental services only within Kanniyakumari district." in bad_pickup_res.json()["detail"]
    print(f"[OK] PASSED: Outside pickup strictly blocked with 400:")
    print(f"     Error detail: {bad_pickup_res.json()['detail']}")

    # 6. Direct API Test: Attempt booking with UNSUPPORTED dropoff location (e.g. Mumbai)
    print("\n[Test 6] Direct API: Attempt booking with outside dropoff location ('Mumbai Airport')...")
    bad_dropoff_res = requests.post(f"{BASE_URL}/api/bookings", json={
        "carId": nagercoil_car["id"],
        "pickup": "Nagercoil Junction Railway Station",
        "dropoff": "Mumbai Airport",
        "start": "2026-11-20T10:00",
        "end": "2026-11-22T10:00",
        "customer": {
            "fullName": "Kanniyakumari Tester",
            "email": customer_email,
            "phone": "+919876543210",
            "license": "TN7420220001234"
        }
    }, headers=cust_headers)
    assert bad_dropoff_res.status_code == 400, f"Expected 400, got {bad_dropoff_res.status_code}: {bad_dropoff_res.text}"
    assert "Sorry, Drivo currently provides car rental services only within Kanniyakumari district." in bad_dropoff_res.json()["detail"]
    print(f"[OK] PASSED: Outside dropoff strictly blocked with 400:")
    print(f"     Error detail: {bad_dropoff_res.json()['detail']}")

    # 7. Test Car Hub Locality Mismatch (e.g. Car at Nagercoil picked up in Colachel)
    print("\n[Test 7] Testing car hub station compatibility check...")
    mismatch_res = requests.post(f"{BASE_URL}/api/bookings", json={
        "carId": nagercoil_car["id"],
        "pickup": "Colachel Port Hub",
        "dropoff": "Colachel Port Hub",
        "start": "2026-11-20T10:00",
        "end": "2026-11-22T10:00",
        "customer": {
            "fullName": "Kanniyakumari Tester",
            "email": customer_email,
            "phone": "+919876543210",
            "license": "TN7420220001234"
        }
    }, headers=cust_headers)
    assert mismatch_res.status_code == 400, f"Expected 400 for hub mismatch, got {mismatch_res.status_code}: {mismatch_res.text}"
    assert "stationed at Nagercoil Hub" in mismatch_res.json()["detail"]
    print(f"[OK] PASSED: Hub locality mismatch properly rejected:")
    print(f"     Error detail: {mismatch_res.json()['detail']}")

    # 8. Successful Booking in Kanniyakumari District
    print("\n[Test 8] Booking with VALID Kanniyakumari pickup and dropoff...")
    import random
    import datetime
    start_offset = random.randint(300, 1000)
    d_start = (datetime.datetime.now() + datetime.timedelta(days=start_offset)).strftime("%Y-%m-%dT10:00")
    d_end = (datetime.datetime.now() + datetime.timedelta(days=start_offset + 3)).strftime("%Y-%m-%dT10:00")
    valid_booking_res = requests.post(f"{BASE_URL}/api/bookings", json={
        "carId": nagercoil_car["id"],
        "pickup": "Nagercoil Junction Railway Station",
        "dropoff": "Nagercoil Vadasery Central Hub",
        "start": d_start,
        "end": d_end,
        "customer": {
            "fullName": "Kanniyakumari Tester",
            "email": customer_email,
            "phone": "+919876543210",
            "license": "TN7420220001234"
        },
        "extras": {
            "insurance": True
        }
    }, headers=cust_headers)
    assert valid_booking_res.status_code in [200, 201], f"Booking failed: {valid_booking_res.text}"
    booking_data = valid_booking_res.json()["booking"]
    print(f"[OK] PASSED: Successfully confirmed booking ref: {booking_data['ref']}")
    print(f"     Pickup: {booking_data['pickup']}")
    print(f"     Dropoff: {booking_data['dropoff']}")

    # 9. Admin Car Creation: Location restriction
    print("\n[Test 9] Admin Car Creation location restriction...")
    admin_login = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@drivo.com",
        "password": "AdminSecure2026!"
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Attempt create car in Chennai -> Rejected with 400
    bad_car_res = requests.post(f"{BASE_URL}/api/cars", json={
        "brand": "Toyota",
        "model": "Innova Hycross",
        "year": 2026,
        "category": "MUV / MPV",
        "fuel": "Hybrid",
        "transmission": "Automatic",
        "seats": 7,
        "pricePerDay": 4500,
        "deposit": 10000,
        "location": "Chennai",
        "image": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
        "available": True
    }, headers=admin_headers)
    assert bad_car_res.status_code == 400, f"Expected 400, got {bad_car_res.status_code}: {bad_car_res.text}"
    assert "Sorry, Drivo currently provides car rental services only within Kanniyakumari district." in bad_car_res.json()["detail"]
    print("[OK] PASSED: Admin cannot add car located outside Kanniyakumari district.")

    # Create car in Nagercoil -> Succeeded with 201
    good_car_res = requests.post(f"{BASE_URL}/api/cars", json={
        "brand": "Toyota",
        "model": "Innova Hycross",
        "year": 2026,
        "category": "MUV / MPV",
        "fuel": "Hybrid",
        "transmission": "Automatic",
        "seats": 7,
        "pricePerDay": 4500,
        "deposit": 10000,
        "location": "Nagercoil",
        "image": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
        "available": True
    }, headers=admin_headers)
    assert good_car_res.status_code in [200, 201], f"Good car creation failed: {good_car_res.text}"
    print(f"[OK] PASSED: Admin created car with valid Kanniyakumari hub ({good_car_res.json()['car']['location']}).")

    print("\n" + "=" * 60)
    print("ALL KANNIYAKUMARI DISTRICT SERVICE AREA TESTS PASSED! [OK]")
    print("=" * 60)

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n[FAIL] TEST SUITE FAILED: {e}")
        sys.exit(1)

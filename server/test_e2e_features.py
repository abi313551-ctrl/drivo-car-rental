import os
import sys
import json
import urllib.request
import urllib.parse
from datetime import datetime, timedelta

def test_features():
    print("=== TESTING AUTH & BOOKINGS ===")
    
    # 1. Test Registration with a timestamped test user
    ts = int(datetime.utcnow().timestamp())
    test_email = f"test_{ts}@example.com"
    test_pwd = "Password@123"
    reg_url = "http://127.0.0.1:8000/api/auth/register"
    reg_payload = json.dumps({
        "fullName": "Test Verification User",
        "email": test_email,
        "password": test_pwd,
        "phone": "+91 9876543210",
        "license": "TN38 20240001234"
    }).encode('utf-8')
    req = urllib.request.Request(reg_url, data=reg_payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        reg_data = json.loads(resp.read().decode('utf-8'))
        print(f"Register success! User created: {reg_data.get('user', {}).get('email')}")
        reg_token = reg_data.get("token")

    # 2. Test Login with the newly registered user
    login_url = "http://127.0.0.1:8000/api/auth/login"
    login_payload = json.dumps({"email": test_email, "password": test_pwd}).encode('utf-8')
    req = urllib.request.Request(login_url, data=login_payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("Login success! Token received, user:", data.get("user", {}).get("fullName"))
        token = data.get("token")

    # 3. Test Booking creation
    start_dt = (datetime.utcnow() + timedelta(days=20)).strftime("%Y-%m-%dT10:00:00")
    end_dt = (datetime.utcnow() + timedelta(days=22)).strftime("%Y-%m-%dT10:00:00")
    booking_url = "http://127.0.0.1:8000/api/bookings"
    booking_payload = json.dumps({
        "carId": 6, # Hyundai Verna Turbo (available)
        "pickup": "Chennai",
        "dropoff": "Chennai",
        "start": start_dt,
        "end": end_dt,
        "customer": {
            "fullName": "Test Customer",
            "email": test_email,
            "phone": "+91 9876543210",
            "license": "TN38 20240001234"
        },
        "extras": {
            "insurance": False,
            "gps": False,
            "childSeat": False
        },
        "couponCode": None,
        "paymentMethod": "card"
    }).encode('utf-8')
    
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    req = urllib.request.Request(booking_url, data=booking_payload, headers=headers)
    with urllib.request.urlopen(req) as resp:
        b_data = json.loads(resp.read().decode('utf-8'))
        pricing = b_data.get('booking', {}).get('pricing', {})
        print(f"Booking creation success! Ref: {b_data.get('booking', {}).get('ref')}, Days: {pricing.get('days')}, Total: INR {pricing.get('total')}")

    # 4. Test Category counts & Filter consistency from /api/cars
    cars_url = "http://127.0.0.1:8000/api/cars"
    with urllib.request.urlopen(cars_url) as resp:
        all_cars = json.loads(resp.read().decode('utf-8')).get("cars", [])
    
    expected_categories = [
        'Hatchback', 'Sedan', 'SUV', 'MUV / MPV', 'Luxury', 'Electric Vehicles'
    ]
    print("\n=== CATEGORY CAR COUNTS FROM /api/cars ===")
    all_passed = True
    for cat in expected_categories:
        count = sum(1 for c in all_cars if c.get("category") == cat)
        passed = count >= 15
        if not passed:
            all_passed = False
        print(f"  Category '{cat}': {count} cars {'[OK >=15]' if passed else '[FAIL <15]'}")
    
    print(f"\nAll 6 categories have >= 15 cars: {all_passed}")
    print(f"Total cars in catalog: {len(all_cars)}")

if __name__ == '__main__':
    test_features()

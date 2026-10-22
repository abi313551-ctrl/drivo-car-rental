"""
Focused test for Mercedes-Benz E-Class booking from Nagercoil
"""
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app
from database import SessionLocal
import models
from schemas import BookingCreateRequest

def test_mercedes_eclass_booking():
    print("=" * 60)
    print("FOCUSED TEST: Mercedes-Benz E-Class Booking from Nagercoil")
    print("=" * 60)

    client = TestClient(app)
    db = SessionLocal()

    try:
        # 1. Locate Mercedes-Benz E-Class in database
        car = db.query(models.Car).filter(
            models.Car.brand == "Mercedes-Benz",
            models.Car.model.like("%E-Class%")
        ).first()

        assert car is not None, "Mercedes-Benz E-Class car not found in database!"
        print(f"[Step 1] Found car ID {car.id}: {car.brand} {car.model}")
        print(f"         Location: {car.location}")
        print(f"         Available: {car.available}")

        # Ensure car location is Nagercoil
        assert car.location == "Nagercoil", f"Expected car location to be 'Nagercoil', got '{car.location}'"
        print("[Step 2] Verified car is stationed at Nagercoil Hub.")

        # 2. Authenticate customer
        customer_email = "tester_mercedes@drivo.com"
        client.post("/api/auth/register", json={
            "fullName": "Mercedes Tester",
            "email": customer_email,
            "password": "Password123!",
            "phone": "+919876543210",
            "license": "TN7420240005555"
        })

        login_res = client.post("/api/auth/login", json={
            "email": customer_email,
            "password": "Password123!"
        })
        assert login_res.status_code == 200, f"Customer login failed: {login_res.text}"
        token = login_res.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"[Step 3] Customer authenticated successfully: {customer_email}")

        # 3. Create booking from Nagercoil Junction Railway Station
        booking_payload = {
            "carId": car.id,
            "pickup": "Nagercoil Junction Railway Station",
            "dropoff": "Nagercoil Junction Railway Station",
            "start": "2026-12-01T10:00",
            "end": "2026-12-03T10:00",
            "customer": {
                "fullName": "Mercedes Tester",
                "email": customer_email,
                "phone": "+919876543210",
                "license": "TN7420240005555"
            }
        }

        print("[Step 4] Sending booking creation request...")
        print(f"         Car: {car.brand} {car.model} (ID: {car.id})")
        print(f"         Pickup: {booking_payload['pickup']}")
        print(f"         Dates: {booking_payload['start']} to {booking_payload['end']}")

        res = client.post("/api/bookings", json=booking_payload, headers=headers)
        print(f"         Response status: {res.status_code}")
        
        assert res.status_code in [200, 201], f"Booking failed with status {res.status_code}: {res.text}"
        data = res.json()
        booking = data.get("booking")
        assert booking is not None, f"No booking object in response: {data}"
        ref = booking.get("ref") or booking.get("reference")
        print(f"[Step 5] Booking CREATED SUCCESSFULLY!")
        print(f"         Booking Reference: {ref}")
        print(f"         Car: {booking.get('car', {}).get('brand')} {booking.get('car', {}).get('model')}")
        print(f"         Pickup Station: {booking.get('pickup')}")
        print(f"         Dropoff Station: {booking.get('dropoff')}")
        print(f"         Total Amount: Rs. {booking.get('pricing', {}).get('total')}")

        # Clean up the test booking
        created_booking_id = booking.get("id")
        if created_booking_id:
            b_record = db.query(models.Booking).filter(models.Booking.id == created_booking_id).first()
            if b_record:
                db.delete(b_record)
                db.commit()
                print(f"[Step 6] Cleaned up test booking ID {created_booking_id}.")

        print("=" * 60)
        print("ALL CHECKS PASSED: Mercedes-Benz E-Class successfully booked from Nagercoil!")
        print("=" * 60)
        return True

    finally:
        db.close()

if __name__ == "__main__":
    test_mercedes_eclass_booking()

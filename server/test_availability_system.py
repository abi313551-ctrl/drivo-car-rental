import sys
import threading
import requests
import time

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("==================================================")
    print("STARTING REAL-TIME AVAILABILITY & CONCURRENCY TESTS")
    print("==================================================")

    # 1. Fetch available cars to select a test car
    r = requests.get(f"{BASE_URL}/cars")
    assert r.status_code == 200, f"Failed to get cars: {r.text}"
    data = r.json()
    cars = data["cars"] if isinstance(data, dict) and "cars" in data else data
    assert len(cars) > 0, "No cars found"
    test_car = cars[0]
    car_id = test_car["id"]
    print(f"[*] Testing with Car #{car_id}: {test_car['brand']} {test_car['model']}")

    # 2. Test Invalid Dates (End Date <= Start Date)
    print("\n--- Test 1: Invalid Date Range Validation (Backend) ---")
    bad_payload = {
        "carId": car_id,
        "pickup": "Mumbai Airport",
        "dropoff": "Mumbai Airport",
        "start": "2026-11-15T15:00",
        "end": "2026-11-15T10:00",  # Earlier than start
        "customer": {
            "fullName": "Test User",
            "email": "test@example.com",
            "phone": "+91 98765 43210",
            "license": "DL14 20110012345"
        }
    }
    r = requests.post(f"{BASE_URL}/bookings", json=bad_payload)
    print(f"Status Code: {r.status_code}")
    print(f"Response: {r.json()}")
    assert r.status_code in (400, 422), "Expected 400 or 422 for return time earlier than pickup time"
    print("[PASS] PASS: Invalid date range rejected.")

    # 3. Create First Confirmed Booking
    print("\n--- Test 2: Create Baseline Active Booking ---")
    start_time = "2026-11-20T10:00"
    end_time = "2026-11-23T18:00"
    booking_payload = {
        "carId": car_id,
        "pickup": "Mumbai Airport",
        "dropoff": "Mumbai Airport",
        "start": start_time,
        "end": end_time,
        "customer": {
            "fullName": "First Customer",
            "email": "first@example.com",
            "phone": "+91 98765 43210",
            "license": "DL14 20110012345"
        }
    }
    r = requests.post(f"{BASE_URL}/bookings", json=booking_payload)
    assert r.status_code == 201, f"Failed to create booking: {r.text}"
    booking_data = r.json()["booking"]
    ref_1 = booking_data["ref"]
    print(f"[PASS] Created booking {ref_1} from {start_time} to {end_time}")

    # 4. Check Availability API for Overlapping Window
    print("\n--- Test 3: Check Availability Endpoint for Overlapping Period ---")
    overlap_check = requests.get(
        f"{BASE_URL}/cars/{car_id}/availability",
        params={"start": "2026-11-21T12:00", "end": "2026-11-22T12:00"}
    )
    print(f"Availability response: {overlap_check.json()}")
    assert overlap_check.status_code == 200
    assert overlap_check.json()["available"] is False, "Expected car to be unavailable during booking window"
    assert "conflict" in overlap_check.json()
    print("[PASS] PASS: Availability endpoint correctly detected conflict.")

    # 5. Overlapping Booking Submission (Must Return 409 Conflict)
    print("\n--- Test 4: Attempt Overlapping Booking (Prevent Double-Booking) ---")
    overlap_payload = {
        "carId": car_id,
        "pickup": "Mumbai Airport",
        "dropoff": "Mumbai Airport",
        "start": "2026-11-22T08:00",
        "end": "2026-11-24T10:00", # Overlaps Nov 20-23
        "customer": {
            "fullName": "Second Customer",
            "email": "second@example.com",
            "phone": "+91 98765 43211",
            "license": "DL14 20110012346"
        }
    }
    r = requests.post(f"{BASE_URL}/bookings", json=overlap_payload)
    print(f"Status Code: {r.status_code}")
    print(f"Response: {r.json()}")
    assert r.status_code == 409, f"Expected 409 Conflict, got {r.status_code}"
    print("[PASS] PASS: Overlapping booking prevented with HTTP 409 Conflict.")

    # 6. Non-Overlapping Booking (Should Succeed)
    print("\n--- Test 5: Non-Overlapping Adjacent Booking ---")
    non_overlap_payload = {
        "carId": car_id,
        "pickup": "Mumbai Airport",
        "dropoff": "Mumbai Airport",
        "start": "2026-11-23T18:00", # Starts right when booking 1 ends, ends before 2026-11-25T10:00
        "end": "2026-11-25T09:00",
        "customer": {
            "fullName": "Adjacent Customer",
            "email": "adjacent@example.com",
            "phone": "+91 98765 43212",
            "license": "DL14 20110012347"
        }
    }
    r = requests.post(f"{BASE_URL}/bookings", json=non_overlap_payload)
    print(f"Status Code: {r.status_code}")
    assert r.status_code == 201, f"Expected 201 Created, got {r.status_code}: {r.text}"
    ref_2 = r.json()["booking"]["ref"]
    print(f"[PASS] PASS: Non-overlapping booking {ref_2} succeeded.")

    # 7. Check Fleet Listing Filter with Availability
    print("\n--- Test 6: GET /api/cars with Date Period and available_only=true ---")
    r = requests.get(
        f"{BASE_URL}/cars",
        params={
            "start": "2026-11-21T00:00",
            "end": "2026-11-22T00:00",
            "available_only": "true"
        }
    )
    assert r.status_code == 200
    res_data = r.json()
    filtered_cars = res_data["cars"] if isinstance(res_data, dict) and "cars" in res_data else res_data
    filtered_ids = [c["id"] for c in filtered_cars]
    assert car_id not in filtered_ids, f"Booked car {car_id} should NOT be in available_only list"
    print(f"[PASS] PASS: Car #{car_id} was filtered out when available_only=true.")

    # 8. Test Concurrent Booking Race Conditions (with_for_update locking)
    print("\n--- Test 7: Concurrent Double-Booking Race Condition Simulation ---")
    sim_start = "2026-12-01T10:00"
    sim_end = "2026-12-05T10:00"
    results = []

    def try_concurrent_booking(cust_id):
        names = {1: "Racer One", 2: "Racer Two"}
        p = {
            "carId": car_id,
            "pickup": "Mumbai Airport",
            "dropoff": "Mumbai Airport",
            "start": sim_start,
            "end": sim_end,
            "customer": {
                "fullName": names[cust_id],
                "email": f"racer{cust_id}@example.com",
                "phone": "+91 98765 43210",
                "license": f"DL14 2011001234{cust_id}"
            }
        }
        res = requests.post(f"{BASE_URL}/bookings", json=p)
        results.append((cust_id, res.status_code, res.json()))

    t1 = threading.Thread(target=try_concurrent_booking, args=(1,))
    t2 = threading.Thread(target=try_concurrent_booking, args=(2,))

    t1.start()
    t2.start()
    t1.join()
    t2.join()

    statuses = [r[1] for r in results]
    print(f"Concurrent status codes: {statuses}")
    assert 201 in statuses, "At least one concurrent booking should succeed (201)"
    assert 409 in statuses, "The simultaneous duplicate booking MUST be rejected with 409 Conflict"
    print("[PASS] PASS: Pessimistic locking successfully prevented race condition double-booking!")

    # 9. Test Booking Cancellation Frees Up Vehicle Immediately
    print("\n--- Test 8: Booking Cancellation Releases Car Immediately ---")
    # Cancel the booking created in Test 2 (ref_1)
    cancel_res = requests.post(f"{BASE_URL}/bookings/{ref_1}/cancel")
    print(f"Cancel status: {cancel_res.status_code}")
    assert cancel_res.status_code == 200, f"Failed to cancel booking: {cancel_res.text}"

    # Now verify availability for that same window
    avail_after_cancel = requests.get(
        f"{BASE_URL}/cars/{car_id}/availability",
        params={"start": "2026-11-21T12:00", "end": "2026-11-22T12:00"}
    )
    print(f"Availability after cancellation: {avail_after_cancel.json()}")
    assert avail_after_cancel.json()["available"] is True, "Car should be available after cancellation"
    print("[PASS] PASS: Cancellation immediately restored car availability!")

    # Clean up test bookings
    for ref in [ref_2]:
        requests.post(f"{BASE_URL}/bookings/{ref}/cancel")
    for r in results:
        if r[1] == 201:
            requests.post(f"{BASE_URL}/bookings/{r[2]['booking']['ref']}/cancel")

    print("\n==================================================")
    print("ALL AVAILABILITY & DOUBLE-BOOKING TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()

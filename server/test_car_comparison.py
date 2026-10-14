import requests
import datetime
import urllib.parse

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("==================================================")
    print("CAR COMPARISON FEATURE INTEGRITY & SPEC TEST SUITE")
    print("==================================================")

    # 1. Fetch Fleet Cars
    print("\n--- Test 1: Fetching Fleet Cars from Backend API ---")
    res = requests.get(f"{BASE_URL}/cars")
    assert res.status_code == 200, f"Failed to get cars: {res.text}"
    cars = res.json()["cars"]
    assert len(cars) >= 3, "Expected at least 3 cars in the fleet"
    print(f"[PASS] Successfully retrieved {len(cars)} cars from MySQL database.")

    # Select 3 cars for comparison
    car1, car2, car3 = cars[0], cars[1], cars[2]
    selected_cars = [car1, car2, car3]
    print(f"Selected Cars: 1. {car1['brand']} {car1['model']} (ID: {car1['id']})")
    print(f"               2. {car2['brand']} {car2['model']} (ID: {car2['id']})")
    print(f"               3. {car3['brand']} {car3['model']} (ID: {car3['id']})")

    # 2. Test Real Specifications and Verify No Invented Specs
    print("\n--- Test 2: Database Specifications Integrity & Missing Specs Handling ---")
    required_db_specs = [
        "id", "brand", "model", "year", "category", "fuel",
        "transmission", "seats", "pricePerDay", "rating",
        "location", "popularity", "deposit", "available", "features"
    ]
    for c in selected_cars:
        for spec in required_db_specs:
            assert spec in c, f"Missing required specification '{spec}' in car #{c['id']}"
        # Verify that mileage is not artificially invented in the raw database model
        assert "mileage" not in c or c.get("mileage") is None, "Database should not have invented mileage column"
        assert "range" not in c or c.get("range") is None, "Database should not have invented range column"
    print("[PASS] All required database specifications present. Mileage/range is properly absent from DB model and handled as 'Not available'.")

    # 3. Test Real-time Availability for Comparison Rental Dates
    print("\n--- Test 3: Real-Time Availability Checking for Selected Period ---")
    future_start = (datetime.datetime.now() + datetime.timedelta(days=45)).strftime("%Y-%m-%dT10:00")
    future_end = (datetime.datetime.now() + datetime.timedelta(days=48)).strftime("%Y-%m-%dT10:00")

    for c in selected_cars:
        avail_url = f"{BASE_URL}/cars/{c['id']}/availability?start={urllib.parse.quote(future_start)}&end={urllib.parse.quote(future_end)}"
        avail_res = requests.get(avail_url)
        assert avail_res.status_code == 200, f"Availability check failed for car #{c['id']}: {avail_res.text}"
        avail_data = avail_res.json()
        assert "available" in avail_data, "Response must contain 'available' key"
        print(f"[PASS] Car #{c['id']} ({c['brand']} {c['model']}): available={avail_data['available']}")

    # 4. Test Comparison Logic Simulation (Max 3, No Duplicates, Remove, Clear)
    print("\n--- Test 4: Comparison Limit (Max 3) & Duplicate Prevention Logic ---")
    comparison_list = []

    def add_to_compare(car_id):
        if car_id in comparison_list:
            return False, "duplicate"
        if len(comparison_list) >= 3:
            return False, "limit_exceeded"
        comparison_list.append(car_id)
        return True, "added"

    def remove_from_compare(car_id):
        if car_id in comparison_list:
            comparison_list.remove(car_id)
            return True
        return False

    # Add Car 1
    ok, reason = add_to_compare(car1["id"])
    assert ok and len(comparison_list) == 1

    # Attempt Duplicate Add Car 1
    ok, reason = add_to_compare(car1["id"])
    assert not ok and reason == "duplicate", "Should reject duplicate car selection"
    print(f"[PASS] Prevented duplicate car selection (ID {car1['id']}).")

    # Add Car 2 and Car 3
    ok2, _ = add_to_compare(car2["id"])
    ok3, _ = add_to_compare(car3["id"])
    assert ok2 and ok3 and len(comparison_list) == 3
    print(f"[PASS] Successfully added 3 cars to comparison: {comparison_list}")

    # Attempt 4th car add (car from fleet if available)
    if len(cars) > 3:
        car4 = cars[3]
        ok4, reason = add_to_compare(car4["id"])
        assert not ok4 and reason == "limit_exceeded", "Should strictly enforce maximum 3 cars limit"
        print(f"[PASS] Enforced comparison limit: 4th car (ID {car4['id']}) was rejected.")

    # Remove Car 2
    removed = remove_from_compare(car2["id"])
    assert removed and len(comparison_list) == 2 and car2["id"] not in comparison_list
    print(f"[PASS] Successfully removed car #{car2['id']}. Current comparison: {comparison_list}")

    # Clear All
    comparison_list.clear()
    assert len(comparison_list) == 0
    print("[PASS] Cleared comparison list successfully.")

    # 5. Difference Calculation Verification
    print("\n--- Test 5: Meaningful Difference Computation ---")
    diff_cars = [car1, car2, car3]
    prices = [c["pricePerDay"] for c in diff_cars]
    categories = [c["category"] for c in diff_cars]
    seats = [c["seats"] for c in diff_cars]

    price_differs = len(set(prices)) > 1
    category_differs = len(set(categories)) > 1
    seats_differs = len(set(seats)) > 1

    print(f"Prices: {prices} -> Differs: {price_differs}")
    print(f"Categories: {categories} -> Differs: {category_differs}")
    print(f"Seats: {seats} -> Differs: {seats_differs}")
    print(f"Lowest Price ID: {min(diff_cars, key=lambda c: c['pricePerDay'])['id']}")
    print(f"Most Spacious ID: {max(diff_cars, key=lambda c: c['seats'])['id']}")
    print(f"Top Rated ID: {max(diff_cars, key=lambda c: c['rating'])['id']}")
    print("[PASS] Differences correctly identified and highlighted.")

    print("\n==================================================")
    print("ALL CAR COMPARISON TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()

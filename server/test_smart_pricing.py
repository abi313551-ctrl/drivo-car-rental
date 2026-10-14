import requests

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("==================================================")
    print("SMART RENTAL PRICE CALCULATOR & INTEGRITY TESTS")
    print("==================================================")

    # 1. Fetch cars to get real test cars
    r = requests.get(f"{BASE_URL}/cars")
    assert r.status_code == 200
    cars_data = r.json()
    cars = cars_data["cars"] if isinstance(cars_data, dict) and "cars" in cars_data else cars_data
    car = cars[0]
    car_id = car["id"]
    price_per_day = car["pricePerDay"]
    deposit = car["deposit"]
    print(f"[*] Testing Car #{car_id}: {car['brand']} {car['model']}")
    print(f"    Daily rate: Rs. {price_per_day}, Deposit: Rs. {deposit}, Category: {car['category']}")

    # TEST 1: Duration calculation across different time intervals
    print("\n--- Test 1: Duration & Base Rental Calculation ---")
    # 24 hours exactly -> 1 day
    p1 = {
        "carId": car_id,
        "start": "2026-11-10T10:00",
        "end": "2026-11-11T10:00",
        "extras": {},
    }
    r = requests.post(f"{BASE_URL}/pricing/calculate", json=p1)
    assert r.status_code == 200, r.text
    pr = r.json()["pricing"]
    assert pr["days"] == 1
    assert pr["base"] == price_per_day * 1
    assert pr["tax"] == round(pr["base"] * 0.18)
    assert pr["total"] == pr["base"] + pr["tax"]
    print(f"[PASS] 24hr rental = {pr['days']} day, base=Rs. {pr['base']}, tax=Rs. {pr['tax']}, total=Rs. {pr['total']}")

    # 25 hours -> rounds up to 2 started days (standard car rental 24-hr block policy)
    p2 = {
        "carId": car_id,
        "start": "2026-11-10T10:00",
        "end": "2026-11-11T11:00",
        "extras": {},
    }
    r = requests.post(f"{BASE_URL}/pricing/calculate", json=p2)
    assert r.status_code == 200, r.text
    pr2 = r.json()["pricing"]
    assert pr2["days"] == 2
    assert pr2["base"] == price_per_day * 2
    print(f"[PASS] 25hr rental = {pr2['days']} days, base=Rs. {pr2['base']}")

    # TEST 2: Price Breakdown with Add-ons (Extras)
    print("\n--- Test 2: Add-ons (Extras) & GST Calculation ---")
    # GPS (200/day) + childSeat (150/day) = 350/day for 3 days = 1050
    p3 = {
        "carId": car_id,
        "start": "2026-11-10T10:00",
        "end": "2026-11-13T10:00", # 3 days
        "extras": {"gps": True, "childSeat": True},
    }
    r = requests.post(f"{BASE_URL}/pricing/calculate", json=p3)
    assert r.status_code == 200
    pr3 = r.json()["pricing"]
    expected_base = price_per_day * 3
    expected_extras = (200 + 150) * 3 # 1050
    expected_taxable = expected_base + expected_extras
    expected_tax = round(expected_taxable * 0.18)
    expected_total = expected_taxable + expected_tax

    assert pr3["days"] == 3
    assert pr3["base"] == expected_base
    assert pr3["extras"] == expected_extras
    assert pr3["tax"] == expected_tax
    assert pr3["total"] == expected_total
    print(f"[PASS] 3 days + Extras: base=Rs. {pr3['base']}, extras=Rs. {pr3['extras']}, GST=Rs. {pr3['tax']}, total=Rs. {pr3['total']}")

    # TEST 3: Coupon Application (Success Case)
    print("\n--- Test 3: Valid Coupon (WELCOME10 - 10% off base) ---")
    p4 = {
        "carId": car_id,
        "start": "2026-11-10T10:00",
        "end": "2026-11-13T10:00",
        "extras": {"gps": True},
        "couponCode": "WELCOME10",
    }
    r = requests.post(f"{BASE_URL}/pricing/calculate", json=p4)
    assert r.status_code == 200
    pr4 = r.json()["pricing"]
    expected_discount = round(expected_base * 0.10)
    expected_taxable4 = expected_base + (200 * 3) - expected_discount
    expected_tax4 = round(expected_taxable4 * 0.18)
    expected_total4 = expected_taxable4 + expected_tax4

    assert pr4["discount"] == expected_discount
    assert pr4["couponCode"] == "WELCOME10"
    assert pr4["tax"] == expected_tax4
    assert pr4["total"] == expected_total4
    print(f"[PASS] Coupon WELCOME10 saved Rs. {pr4['discount']}, final payable: Rs. {pr4['total']}")

    # TEST 4: Coupon Failure Cases (Invalid code, category mismatch)
    print("\n--- Test 4: Coupon Failure Validations ---")
    # Invalid code
    p_fake = {
        "carId": car_id,
        "start": "2026-11-10T10:00",
        "end": "2026-11-13T10:00",
        "couponCode": "FAKECODE99",
    }
    r_fake = requests.post(f"{BASE_URL}/pricing/calculate", json=p_fake)
    assert r_fake.status_code == 400, "Fake coupon should be rejected with 400"
    print(f"[PASS] Fake coupon rejected: {r_fake.json()['detail']}")

    # EVGO500 on non-electric car (Car #1 is Hatchback or SUV)
    if car["category"] != "Electric":
        p_cat = {
            "carId": car_id,
            "start": "2026-11-10T10:00",
            "end": "2026-11-13T10:00",
            "couponCode": "EVGO500",
        }
        r_cat = requests.post(f"{BASE_URL}/pricing/calculate", json=p_cat)
        assert r_cat.status_code == 400, "EVGO500 on non-EV car should be rejected"
        print(f"[PASS] Category-restricted coupon rejected on non-EV car: {r_cat.json()['detail']}")

    # TEST 5: Date validation (Negative duration / End <= Start)
    print("\n--- Test 5: Invalid Date / Negative Duration ---")
    p_bad_date = {
        "carId": car_id,
        "start": "2026-11-15T15:00",
        "end": "2026-11-15T10:00", # earlier than start
    }
    r_bad = requests.post(f"{BASE_URL}/pricing/calculate", json=p_bad_date)
    assert r_bad.status_code == 400
    print(f"[PASS] Invalid date range rejected: {r_bad.json()['detail']}")

    # TEST 6: Authoritative Backend Pricing & Price Tampering Prevention
    print("\n--- Test 6: Authoritative Backend Calculation (Never trust client prices) ---")
    # The client cannot tamper with total because create_booking re-computes everything from the Car ID in DB
    # We submit a booking payload (which doesn't even accept client total, computing it from MySQL price_per_day)
    booking_p = {
        "carId": car_id,
        "pickup": "Chennai Airport",
        "dropoff": "Chennai Airport",
        "start": "2026-12-10T10:00",
        "end": "2026-12-12T10:00", # 2 days
        "extras": {"gps": True},
        "couponCode": "WELCOME10",
        "customer": {
            "fullName": "Price Tester",
            "email": "pricetester@example.com",
            "phone": "+91 98765 43210",
            "license": "TN37 20200012345"
        }
    }
    r_book = requests.post(f"{BASE_URL}/bookings", json=booking_p)
    assert r_book.status_code == 201, r_book.text
    saved_booking = r_book.json()["booking"]
    saved_pricing = saved_booking["pricing"]

    expected_b_days = 2
    expected_b_base = price_per_day * 2
    expected_b_extras = 200 * 2
    expected_b_discount = round(expected_b_base * 0.10)
    expected_b_tax = round((expected_b_base + expected_b_extras - expected_b_discount) * 0.18)
    expected_b_total = expected_b_base + expected_b_extras - expected_b_discount + expected_b_tax

    assert saved_pricing["days"] == expected_b_days
    assert saved_pricing["base"] == expected_b_base
    assert saved_pricing["extras"] == expected_b_extras
    assert saved_pricing["discount"] == expected_b_discount
    assert saved_pricing["tax"] == expected_b_tax
    assert saved_pricing["total"] == expected_b_total
    assert saved_pricing["deposit"] == deposit
    print(f"[PASS] Persisted booking {saved_booking['ref']} pricing matches backend calculation exactly:")
    print(f"       Days: {saved_pricing['days']}, Base: Rs. {saved_pricing['base']}, Extras: Rs. {saved_pricing['extras']},")
    print(f"       Discount: -Rs. {saved_pricing['discount']}, GST: Rs. {saved_pricing['tax']}, Total: Rs. {saved_pricing['total']}")

    # TEST 7: Receipt Breakdown Integrity
    print("\n--- Test 7: Receipt & Invoice Price Integrity ---")
    r_rcpt = requests.get(f"{BASE_URL}/bookings/{saved_booking['ref']}/receipt")
    assert r_rcpt.status_code == 200
    rcpt = r_rcpt.json()["receipt"]
    ch = rcpt["charges"]
    assert ch["baseRental"] == expected_b_base
    assert ch["extras"] == expected_b_extras
    assert ch["discount"] == expected_b_discount
    assert ch["gst"] == expected_b_tax
    assert ch["securityDeposit"] == deposit
    assert ch["totalAmount"] == expected_b_total
    print(f"[PASS] Receipt invoice #{rcpt['invoiceNumber']} charges mirror stored pricing identically.")

    # Clean up test booking
    requests.post(f"{BASE_URL}/bookings/{saved_booking['ref']}/cancel")

    print("\n==================================================")
    print("ALL SMART PRICING TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()

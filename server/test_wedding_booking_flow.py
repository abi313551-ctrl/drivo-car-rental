import requests, json, sys, time

sys.stdout.reconfigure(encoding='utf-8')
BASE_URL = "http://127.0.0.1:8000"

def test_flow():
    print("=== TESTING CAR FLOWER DECORATION BOOKING FLOW & MYSQL INTEGRATION ===")

    # 1. Check API health & packages
    resp = requests.get(f"{BASE_URL}/api/decorations/packages")
    assert resp.status_code == 200, f"Failed: {resp.text}"
    pkgs = resp.json().get("packages", [])
    assert len(pkgs) >= 20, f"Expected at least 20 packages, got {len(pkgs)}"
    print(f"✓ Found {len(pkgs)} active car flower decoration designs in MySQL database")

    # 2. Authenticate customer
    login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "priya@drivo.example", "password": "customer123"})
    assert login_resp.status_code == 200, f"Customer login failed: {login_resp.text}"
    token = login_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Customer authenticated successfully")

    # 3. Test authoritative pricing calculation for 'Decorate My Own Car'
    pkg = pkgs[0] # Royal Scarlet Emperor Hood Bouquet
    calc_resp = requests.post(f"{BASE_URL}/api/decorations/calculate-price", json={
        "packageId": pkg["id"],
        "driveMode": "decor_only",
        "additionalAddons": ["ribbons_bows", "handle_mirrors_decor"],
        "serviceCity": "Nagercoil",
        "venueLocation": "Sri Krishna Mandapam, Nagercoil"
    })
    assert calc_resp.status_code == 200
    pricing = calc_resp.json()["pricing"]
    assert pricing["decorPackagePrice"] == pkg["startingPrice"]
    assert pricing["carRentalCharge"] == 0
    assert pricing["addonsTotal"] == 1000 # 500 + 500
    print(f"✓ Authoritative price calculation (Own Car + Addons): ₹{pricing['total']} (Taxable ₹{pricing['taxable']} + GST ₹{pricing['gst']})")

    # 4. Create actual booking in MySQL
    event_date = f"2027-02-{(int(time.time()) % 25) + 1:02d}"
    booking_payload = {
        "packageId": pkg["id"],
        "customerName": "Saravanan & Priya",
        "customerPhone": "+91 98765 43210",
        "customerEmail": "saravanan@example.com",
        "eventType": "Wedding",
        "eventDate": event_date,
        "completionTime": "06:30 AM",
        "venueLocation": "Sri Krishna Mandapam, WCC Road, Nagercoil",
        "driveMode": "decor_only",
        "additionalAddons": ["ribbons_bows", "handle_mirrors_decor"],
        "specialNotes": "Please style with deep crimson roses and gold organza ribbons."
    }

    create_resp = requests.post(f"{BASE_URL}/api/decorations/bookings", json=booking_payload, headers=headers)
    assert create_resp.status_code == 201, f"Failed: {create_resp.text}"
    booking_data = create_resp.json()["booking"]
    booking_ref = booking_data["ref"]
    print(f"✓ Successfully created wedding decoration booking in MySQL! Reference: {booking_ref}")
    assert booking_ref.startswith("WED-")
    assert booking_data["status"] == "Pending"
    assert booking_data["customerName"] == "Saravanan & Priya"

    # 5. Verify customer can retrieve their booking
    my_resp = requests.get(f"{BASE_URL}/api/decorations/bookings/my", headers=headers)
    assert my_resp.status_code == 200
    my_bookings = my_resp.json()["bookings"]
    assert any(b["ref"] == booking_ref for b in my_bookings)
    print(f"✓ Customer can view their confirmed booking in My Bookings & Dashboard")

    print("\n🎉 ALL CAR FLOWER DECORATION BOOKING TESTS PASSED!")

if __name__ == "__main__":
    test_flow()

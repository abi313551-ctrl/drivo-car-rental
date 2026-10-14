import io
import json
import sys
import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=== STARTING WEDDING DECORATION TEST SUITE ===")

    # 1. Login as customer
    login_cust = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "priya@drivo.example", "password": "customer123"})
    assert login_cust.status_code == 200, f"Customer login failed: {login_cust.text}"
    cust_token = login_cust.json()["token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    print("✓ Customer authenticated successfully")

    # 2. Login as admin
    login_admin = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@drivo.example", "password": "admin123"})
    assert login_admin.status_code == 200, f"Admin login failed: {login_admin.text}"
    admin_token = login_admin.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("✓ Admin authenticated successfully")

    # 3. List Packages
    pkgs_resp = requests.get(f"{BASE_URL}/api/decorations/packages")
    assert pkgs_resp.status_code == 200, f"List packages failed: {pkgs_resp.text}"
    pkgs = pkgs_resp.json()["packages"]
    assert len(pkgs) >= 4, f"Expected at least 4 packages, got {len(pkgs)}"
    print(f"✓ Found {len(pkgs)} active packages:")
    for p in pkgs:
        print(f"   - {p['name']}: starting from ₹{p['startingPrice']} (slug: {p['slug']})")

    classic_pkg = next(p for p in pkgs if "Classic" in p["name"])
    luxury_pkg = next(p for p in pkgs if "Luxury" in p["name"])

    # 4. Calculate Price - Decor Only
    calc_resp = requests.post(
        f"{BASE_URL}/api/decorations/calculate-price",
        json={
            "packageId": classic_pkg["id"],
            "additionalAddons": ["ribbons_bows", "handle_mirrors_decor"],
            "serviceCity": "Nagercoil",
            "venueLocation": "Krishnancoil Mandapam, Nagercoil",
        },
    )
    assert calc_resp.status_code == 200, f"Price calc failed: {calc_resp.text}"
    pricing = calc_resp.json()["pricing"]
    assert pricing["decorPackagePrice"] == classic_pkg["startingPrice"]
    assert pricing["carRentalCharge"] == 0
    assert pricing["addonsTotal"] == 1000
    assert pricing["taxable"] == classic_pkg["startingPrice"] + 1000
    assert pricing["gst"] == round(pricing["taxable"] * 0.18, 2)
    assert pricing["deposit"] == 0
    assert pricing["total"] == pricing["taxable"] + pricing["gst"]
    print(f"✓ Authoritative price calculation (Decor Only) verified: Total = ₹{pricing['total']} (Taxable ₹{pricing['taxable']} + GST ₹{pricing['gst']})")

    # 5. Calculate Price - Decor + Rental Car
    # Get available car
    cars_resp = requests.get(f"{BASE_URL}/api/cars")
    cars_data = cars_resp.json()
    cars = cars_data.get("cars", []) if isinstance(cars_data, dict) else cars_data
    first_car = cars[0]

    calc_car_resp = requests.post(
        f"{BASE_URL}/api/decorations/calculate-price",
        json={
            "packageId": luxury_pkg["id"],
            "carId": first_car["id"],
            "driveMode": "self_drive",
            "additionalAddons": ["fresh_jasmine_garlands"],
            "serviceCity": "Kanyakumari",
            "venueLocation": "Beach Resort, Kanyakumari",
        },
    )
    assert calc_car_resp.status_code == 200, f"Car price calc failed: {calc_car_resp.text}"
    car_pricing = calc_car_resp.json()["pricing"]
    assert car_pricing["decorPackagePrice"] == luxury_pkg["startingPrice"]
    assert car_pricing["carRentalCharge"] == first_car["pricePerDay"]
    assert car_pricing["deposit"] == first_car["deposit"]
    print(f"✓ Authoritative price calculation (Decor + Self-Drive) verified: Total = ₹{car_pricing['total']} (Car: ₹{car_pricing['carRentalCharge']}, Deposit: ₹{car_pricing['deposit']})")

    # Also test with_driver mode
    calc_driver_resp = requests.post(
        f"{BASE_URL}/api/decorations/calculate-price",
        json={
            "packageId": luxury_pkg["id"],
            "carId": first_car["id"],
            "driveMode": "with_driver",
            "expectedDurationHours": 10,
            "expectedDistanceKm": 120,
            "serviceCity": "Nagercoil",
        },
    )
    assert calc_driver_resp.status_code == 200
    driver_pricing = calc_driver_resp.json()["pricing"]
    assert driver_pricing["deposit"] == 0  # No deposit for chauffeur driven
    assert driver_pricing["driverBaseCharge"] == 1000
    assert driver_pricing["extraHoursCharge"] == 400  # (10 - 8) * 200
    assert driver_pricing["extraDistanceCharge"] == 400  # (120 - 100) * 20
    assert driver_pricing["driverTotalCharge"] == 1800
    print(f"✓ Authoritative price calculation (With Driver + Overtime) verified: Total = ₹{driver_pricing['total']}")

    # 6. Upload Reference Image
    # 1x1 minimal valid JPEG
    jpeg_bytes = bytes([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
        0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
        0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
        0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
        0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
        0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F,
        0x00, 0xBF, 0x00, 0xFF, 0xD9
    ])
    files = {"file": ("wedding_inspiration.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")}
    upload_resp = requests.post(f"{BASE_URL}/api/decorations/upload-image", files=files)
    assert upload_resp.status_code == 200, f"Upload failed: {upload_resp.text}"
    uploaded_url = upload_resp.json()["url"]
    assert "/uploads/decorations/" in uploaded_url
    print(f"✓ Uploaded inspiration photo successfully: {uploaded_url}")

    # 7. Create Wedding Booking Request
    import time
    event_date = f"2027-01-{(int(time.time()) % 25) + 1:02d}"
    booking_payload = {
        "packageId": classic_pkg["id"],
        "carId": first_car["id"],
        "customerName": "Saravanan & Priya",
        "customerPhone": "+91 98765 43210",
        "customerEmail": "priya@drivo.example",
        "eventType": "Wedding Muhurtham",
        "eventDate": event_date,
        "completionTime": "06:30 AM",
        "venueLocation": "Sri Krishna Mandapam, WCC Road, Nagercoil",
        "serviceCity": "Nagercoil",
        "flowerColors": "Classic Red & Gold Accents",
        "decorStyle": "Grand Royal Arch & Bonnet Cascade",
        "additionalAddons": ["ribbons_bows", "handle_mirrors_decor"],
        "specialNotes": "Please style the front hood with auspicious double garlands.",
        "referenceImage": uploaded_url,
    }

    create_resp = requests.post(f"{BASE_URL}/api/decorations/bookings", json=booking_payload, headers=cust_headers)
    assert create_resp.status_code == 201, f"Create booking failed: {create_resp.text}"
    booking_data = create_resp.json()["booking"]
    booking_ref = booking_data["ref"]
    booking_id = booking_data["id"]
    assert booking_ref.startswith("WED-")
    assert booking_data["status"] == "Pending"
    assert booking_data["paymentStatus"] == "Pending"
    assert booking_data["customerName"] == "Saravanan & Priya"
    assert booking_data["referenceImage"] == uploaded_url
    print(f"✓ Created wedding decoration booking {booking_ref} (ID {booking_id})")

    # 8. Fetch My Bookings as Customer
    my_resp = requests.get(f"{BASE_URL}/api/decorations/bookings/my", headers=cust_headers)
    assert my_resp.status_code == 200, f"Get my bookings failed: {my_resp.text}"
    my_bookings = my_resp.json()["bookings"]
    assert any(b["ref"] == booking_ref for b in my_bookings)
    print(f"✓ Verified booking appears in customer's my-bookings list")

    # 9. Verify Car Conflict Check (prevent double booking of same car on same date once confirmed)
    # Confirm the booking via Admin first
    admin_confirm = requests.patch(
        f"{BASE_URL}/api/admin/decorations/bookings/{booking_id}/status",
        json={"status": "Confirmed", "paymentStatus": "Paid"},
        headers=admin_headers,
    )
    assert admin_confirm.status_code == 200, f"Admin confirm failed: {admin_confirm.text}"
    print(f"✓ Admin confirmed wedding booking {booking_ref} and marked payment as Paid")

    # Try booking same car on same event date -> Must fail with 409 Conflict
    conflict_payload = dict(booking_payload)
    conflict_payload["customerName"] = "Another Customer"
    conflict_payload["customerEmail"] = "another@example.com"
    conflict_resp = requests.post(f"{BASE_URL}/api/decorations/bookings", json=conflict_payload)
    assert conflict_resp.status_code == 409, f"Expected 409 Conflict, got {conflict_resp.status_code}: {conflict_resp.text}"
    print(f"✓ Conflict detection verified: duplicate car booking on {event_date} correctly rejected with 409 Conflict")

    # 10. Admin: List All Bookings
    admin_list = requests.get(f"{BASE_URL}/api/admin/decorations/bookings", headers=admin_headers)
    assert admin_list.status_code == 200
    all_admin_bookings = admin_list.json()["bookings"]
    assert any(b["ref"] == booking_ref for b in all_admin_bookings)
    print(f"✓ Admin retrieved {len(all_admin_bookings)} decoration bookings")

    # 11. Admin: Update package starting price & items
    update_pkg_resp = requests.put(
        f"{BASE_URL}/api/admin/decorations/packages/{classic_pkg['id']}",
        json={
            "name": classic_pkg["name"],
            "startingPrice": 2200,
            "badge": "Updated Best Seller",
            "includedItems": classic_pkg["includedItems"] + ["Free Congratulations Card"],
        },
        headers=admin_headers,
    )
    assert update_pkg_resp.status_code == 200, f"Update package failed: {update_pkg_resp.text}"
    updated_pkg = update_pkg_resp.json()["package"]
    assert updated_pkg["startingPrice"] == 2200
    assert updated_pkg["badge"] == "Updated Best Seller"
    print(f"✓ Admin updated {classic_pkg['name']} starting price to ₹2,200 and added included item")

    # Revert package price back to original 2000 so initial tests remain clean
    requests.put(
        f"{BASE_URL}/api/admin/decorations/packages/{classic_pkg['id']}",
        json={"startingPrice": 2000, "badge": "Best Seller"},
        headers=admin_headers,
    )

    # 12. Admin: Driver List & Assignment Test
    drivers_resp = requests.get(f"{BASE_URL}/api/admin/decorations/drivers", headers=admin_headers)
    assert drivers_resp.status_code == 200
    drivers_list = drivers_resp.json()["drivers"]
    assert len(drivers_list) >= 4
    first_driver = drivers_list[0]
    print(f"✓ Admin retrieved {len(drivers_list)} verified chauffeurs (e.g., {first_driver['name']}, Rating: {first_driver['rating']}★)")

    # Assign driver to the confirmed booking
    assign_resp = requests.patch(
        f"{BASE_URL}/api/admin/decorations/bookings/{booking_id}/assign-driver",
        json={"driverId": first_driver["id"]},
        headers=admin_headers,
    )
    assert assign_resp.status_code == 200, f"Driver assignment failed: {assign_resp.text}"
    assigned_booking = assign_resp.json()["booking"]
    assert assigned_booking["driverId"] == first_driver["id"]
    assert assigned_booking["driver"]["name"] == first_driver["name"]
    print(f"✓ Chauffeur {first_driver['name']} assigned to booking {booking_ref}")

    # Check driver pricing config endpoint
    driver_pricing_resp = requests.get(f"{BASE_URL}/api/decorations/driver-pricing")
    assert driver_pricing_resp.status_code == 200
    dp_cfg = driver_pricing_resp.json()["driverPricing"]
    assert dp_cfg["baseDriverFee"] == 1000
    print(f"✓ Verified driver pricing rules: Base ₹{dp_cfg['baseDriverFee']} for {dp_cfg['includedHours']}h / {dp_cfg['includedKm']}km")

    print("\n🎉 ALL 12 WEDDING CAR DECORATION & CHAUFFEUR ENHANCEMENT TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    run_tests()

import os
import io
import time
from fastapi.testclient import TestClient
from main import app, CAR_UPLOADS_DIR
from database import SessionLocal
from models import User, Car, Booking
from auth import hash_password

client = TestClient(app)

# Genuine small valid JPEG byte sequence (SOI, APP0, SOF0, EOI)
VALID_JPEG_BYTES = (
    b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00"
    b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
    b"\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a"
    b"\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342"
    b"\xff\xc0\x00\x0b\x08\x00\x08\x00\x08\x01\x01\x11\x00"
    b"\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00"
    b"\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b"
    b"\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
)

# Genuine small valid PNG byte sequence
VALID_PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00"
    b"\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
)

def run_tests():
    db = SessionLocal()
    print("=" * 70)
    print("RUNNING DRIVO ADMIN PORTAL & CAR IMAGE UPLOAD INTEGRATION TESTS")
    print("=" * 70)

    try:
        # 1. Admin Authentication
        print("\n[Step 1] Testing Admin Authentication...")
        # Invalid password
        res_bad = client.post("/api/admin/login", json={"email": "admin@drivo.com", "password": "WrongPassword!"})
        assert res_bad.status_code == 401
        print("  - Invalid password rejected with 401 [OK]")

        # Valid admin login
        res_login = client.post("/api/admin/login", json={"email": "admin@drivo.com", "password": "AdminSecure2026!"})
        assert res_login.status_code == 200
        admin_data = res_login.json()
        assert "token" in admin_data
        admin_token = admin_data["token"]
        auth_headers = {"Authorization": f"Bearer {admin_token}"}
        print("  - Admin login succeeded with 200, JWT token acquired [OK]")

        # 2. Access control on admin routes
        print("\n[Step 2] Testing Role-based Access Control...")
        # Unauthorized access without token
        res_no_auth = client.get("/api/admin/cars")
        assert res_no_auth.status_code == 401
        print("  - Anonymous request to /api/admin/cars rejected with 401 [OK]")

        # 3. Test Image Upload Validation & Magic Bytes
        print("\n[Step 3] Testing Image Upload Validation & File Storage...")
        # Spoofed file (text file with .jpg extension)
        fake_file = io.BytesIO(b"This is not a real image file, just plain text disguised.")
        res_fake = client.post(
            "/api/admin/cars/upload-image",
            headers=auth_headers,
            files={"file": ("fake_car.jpg", fake_file, "image/jpeg")},
        )
        assert res_fake.status_code == 400
        assert "Uploaded file content does not match" in res_fake.json()["detail"]
        print("  - Spoofed text file disguised as .jpg correctly rejected with 400 [OK]")

        # Genuine JPEG upload
        real_file = io.BytesIO(VALID_JPEG_BYTES)
        res_upload = client.post(
            "/api/admin/cars/upload-image",
            headers=auth_headers,
            files={"file": ("bmw_m5_sample.jpg", real_file, "image/jpeg")},
        )
        assert res_upload.status_code == 200, f"Upload failed: {res_upload.text}"
        upload_data = res_upload.json()
        image_url = upload_data["url"]
        uploaded_filename = upload_data["filename"]
        assert image_url.startswith("/uploads/cars/")
        assert (CAR_UPLOADS_DIR / uploaded_filename).is_file()
        print(f"  - Genuine JPG uploaded: {image_url} ({upload_data['size']} bytes) [OK]")

        # 4. Verify Static File Serving
        print("\n[Step 4] Verifying Static Serving of Uploaded Car Image...")
        res_static = client.get(image_url)
        assert res_static.status_code == 200
        assert res_static.headers.get("content-type") in ("image/jpeg", "image/jpg")
        assert len(res_static.content) == len(VALID_JPEG_BYTES)
        print("  - Static file route correctly serves uploaded image with 200 OK [OK]")

        # Also test via /api/uploads
        res_api_static = client.get(f"/api{image_url}")
        assert res_api_static.status_code == 200
        print("  - Static file route also accessible via /api/uploads [OK]")

        # 5. Create Car via Admin API
        print("\n[Step 5] Adding New Car to MySQL Database...")
        new_car_payload = {
            "brand": "BMW",
            "model": "M5 Competition 2026",
            "registrationNumber": "TN-74-AX-9999",
            "year": 2026,
            "category": "Luxury",
            "fuel": "Petrol",
            "transmission": "Automatic",
            "seats": 5,
            "pricePerDay": 12500,
            "deposit": 25000,
            "location": "Nagercoil",
            "image": image_url,
            "images": [image_url],
            "available": True,
            "description": "Exclusive luxury sports sedan with V8 biturbo and carbon ceramic brakes.",
        }

        res_create = client.post("/api/admin/cars", headers=auth_headers, json=new_car_payload)
        assert res_create.status_code == 201, f"Car creation failed: {res_create.text}"
        created_car = res_create.json()["car"]
        car_id = created_car["id"]
        assert created_car["brand"] == "BMW"
        assert created_car["model"] == "M5 Competition 2026"
        assert created_car["registrationNumber"] == "TN-74-AX-9999"
        assert created_car["image"] == image_url
        assert created_car["description"] == new_car_payload["description"]
        print(f"  - Created Car #{car_id}: {created_car['brand']} {created_car['model']} in MySQL [OK]")

        # 6. Verify Car in Admin List and Customer Fleet List
        print("\n[Step 6] Verifying Car in Admin & Customer Fleet...")
        res_admin_list = client.get("/api/admin/cars", headers=auth_headers)
        assert res_admin_list.status_code == 200
        admin_cars = res_admin_list.json()["cars"]
        assert any(c["id"] == car_id for c in admin_cars)
        print(f"  - Car #{car_id} present in Admin Cars List ({len(admin_cars)} total cars) [OK]")

        res_cust_list = client.get("/api/cars")
        assert res_cust_list.status_code == 200
        cust_cars = res_cust_list.json()["cars"]
        target_cust_car = next((c for c in cust_cars if c["id"] == car_id), None)
        assert target_cust_car is not None
        assert target_cust_car["image"] == image_url
        assert target_cust_car["pricePerDay"] == 12500
        print(f"  - Car #{car_id} immediately visible on customer website /api/cars [OK]")

        # 7. Edit Car and Replace Image
        print("\n[Step 7] Testing Car Edit and Replacement Image Upload...")
        png_file = io.BytesIO(VALID_PNG_BYTES)
        res_png_upload = client.post(
            "/api/admin/cars/upload-image",
            headers=auth_headers,
            files={"file": ("bmw_m5_replacement.png", png_file, "image/png")},
        )
        assert res_png_upload.status_code == 200
        new_image_url = res_png_upload.json()["url"]
        new_uploaded_filename = res_png_upload.json()["filename"]

        update_payload = {
            **new_car_payload,
            "model": "M5 Competition Carbon Edition",
            "pricePerDay": 13500,
            "image": new_image_url,
            "images": [new_image_url],
            "description": "Updated carbon edition package with sport exhaust.",
        }

        res_update = client.put(f"/api/admin/cars/{car_id}", headers=auth_headers, json=update_payload)
        assert res_update.status_code == 200, f"Update failed: {res_update.text}"
        updated_car = res_update.json()["car"]
        assert updated_car["model"] == "M5 Competition Carbon Edition"
        assert updated_car["pricePerDay"] == 13500
        assert updated_car["image"] == new_image_url
        print(f"  - Car #{car_id} updated with new image and details [OK]")

        # 8. Test Toggle Availability
        print("\n[Step 8] Testing Availability Toggle & Booking Prevention...")
        res_toggle = client.patch(f"/api/admin/cars/{car_id}/availability?available=false", headers=auth_headers)
        assert res_toggle.status_code == 200
        assert res_toggle.json()["car"]["available"] is False
        print("  - Car availability toggled to False [OK]")

        # Attempt to book unavailable car
        res_book_unavail = client.post("/api/bookings", json={
            "carId": car_id,
            "pickup": "Nagercoil Central Station Hub",
            "dropoff": "Nagercoil Central Station Hub",
            "start": "2026-10-25T10:00",
            "end": "2026-10-27T10:00",
            "customer": {
                "fullName": "Test Customer",
                "email": "customer@example.com",
                "phone": "+91 98765 43210",
                "license": "TN3720190012345"
            }
        })
        assert res_book_unavail.status_code == 400
        assert "currently marked unavailable" in res_book_unavail.json()["detail"]
        print("  - Customer booking on unavailable car strictly blocked with 400 [OK]")

        # 9. Test Direct Multipart Creation (Single Request Upload & Create)
        print("\n[Step 9] Testing Direct Multipart/Form-data Creation...")
        form_file = io.BytesIO(VALID_JPEG_BYTES)
        res_multipart = client.post(
            "/api/admin/cars",
            headers=auth_headers,
            data={
                "brand": "Audi",
                "model": "RS6 Avant 2026",
                "registrationNumber": "TN-75-B-8888",
                "year": "2026",
                "category": "Luxury",
                "fuel": "Petrol",
                "transmission": "Automatic",
                "seats": "5",
                "pricePerDay": "14000",
                "deposit": "30000",
                "location": "Nagercoil",
                "description": "High-performance luxury estate.",
                "available": "true"
            },
            files={"file": ("audi_rs6.jpg", form_file, "image/jpeg")}
        )
        assert res_multipart.status_code == 201
        audi_car = res_multipart.json()["car"]
        audi_id = audi_car["id"]
        assert audi_car["brand"] == "Audi"
        assert audi_car["image"].startswith("/uploads/cars/")
        print(f"  - Direct multipart form-data creation created Car #{audi_id} with file upload [OK]")

        # 10. Safe Delete Test
        print("\n[Step 10] Testing Safe Vehicle Deletion...")
        res_del = client.delete(f"/api/admin/cars/{car_id}", headers=auth_headers)
        assert res_del.status_code == 200
        print(f"  - Deleted Car #{car_id} [OK]")

        res_del_audi = client.delete(f"/api/admin/cars/{audi_id}", headers=auth_headers)
        assert res_del_audi.status_code == 200
        print(f"  - Deleted Car #{audi_id} [OK]")

        # 11. Admin Dashboard Stats & Bookings
        print("\n[Step 11] Verifying Admin Dashboard Metrics & Booking Queries...")
        res_stats = client.get("/api/admin/stats", headers=auth_headers)
        assert res_stats.status_code == 200
        stats = res_stats.json()
        assert "totalCars" in stats
        assert "availableCars" in stats
        assert "totalBookings" in stats
        assert "pendingBookings" in stats
        assert "confirmedBookings" in stats
        assert "totalUsers" in stats
        print(f"  - Stats verified: {stats['totalCars']} cars, {stats['totalBookings']} bookings, {stats['totalUsers']} users [OK]")

        res_bookings = client.get("/api/admin/bookings", headers=auth_headers)
        assert res_bookings.status_code == 200
        b_list = res_bookings.json()["bookings"]
        assert len(b_list) > 0
        sample_b = b_list[0]
        assert "ref" in sample_b
        assert "car" in sample_b
        assert "customer" in sample_b
        print(f"  - Bookings verified: {len(b_list)} records retrieved with car and customer metadata [OK]")

        print("\n" + "=" * 70)
        print("ALL 11 ADMIN WORKFLOW & IMAGE UPLOAD TESTS PASSED WITH 100% SUCCESS!")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()

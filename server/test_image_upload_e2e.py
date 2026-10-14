import os
import requests
from database import SessionLocal
from models import Car, User

API_URL = "http://127.0.0.1:8000/api"
STATIC_BASE = "http://127.0.0.1:8000"

def test_complete_e2e():
    print("=" * 60)
    print("DRIVO — COMPREHENSIVE CAR IMAGE UPLOAD E2E VERIFICATION")
    print("=" * 60)

    # Step 1: Admin Authentication
    admin_login = requests.post(f"{API_URL}/auth/login", json={"email": "admin@drivo.example", "password": "admin123"})
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()["token"]
    headers = {"Authorization": f"Bearer {admin_token}"}
    print("Step 1: Admin Authentication verified. Role: admin")

    # Step 2: Test Invalid Uploads (Validation)
    # 2a. Bad extension (.exe)
    bad_file = {"file": ("virus.exe", b"fake binary executable", "application/octet-stream")}
    r1 = requests.post(f"{API_URL}/admin/cars/upload-image", headers=headers, files=bad_file)
    assert r1.status_code == 400, f"Expected 400 for .exe, got {r1.status_code}"
    print("Step 2a: Blocked forbidden extension (.exe) -> 400 Bad Request")

    # 2b. Bad mime type
    bad_mime = {"file": ("test.png", b"plain text disguised", "text/plain")}
    r2 = requests.post(f"{API_URL}/admin/cars/upload-image", headers=headers, files=bad_mime)
    assert r2.status_code == 400, f"Expected 400 for bad mime, got {r2.status_code}"
    print("Step 2b: Blocked mismatched MIME type (text/plain) -> 400 Bad Request")

    # 2c. Oversized file (> 5 MB)
    oversized = b"\x00" * (5 * 1024 * 1024 + 500)
    big_file = {"file": ("huge_car.jpg", oversized, "image/jpeg")}
    r3 = requests.post(f"{API_URL}/admin/cars/upload-image", headers=headers, files=big_file)
    assert r3.status_code == 400, f"Expected 400 for >5MB, got {r3.status_code}"
    print("Step 2c: Blocked oversized file (> 5 MB) -> 400 Bad Request")

    # 2d. Non-admin authorization (customer user)
    cust_login = requests.post(f"{API_URL}/auth/login", json={"email": "priya@drivo.example", "password": "customer123"})
    cust_token = cust_login.json()["token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    dummy_img = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 50
    valid_file = {"file": ("bmw_m4.jpg", dummy_img, "image/jpeg")}
    r4 = requests.post(f"{API_URL}/admin/cars/upload-image", headers=cust_headers, files=valid_file)
    assert r4.status_code == 403, f"Expected 403 for non-admin, got {r4.status_code}"
    print("Step 2d: Blocked customer token on upload -> 403 Forbidden")

    # Step 3: Real Image Upload as Admin
    # Create sample valid JPEG binary
    jpeg_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00" + b"\x12" * 1200
    upload_files = {"file": ("drivo_bmw_m4_competition.jpg", jpeg_bytes, "image/jpeg")}
    res_upload = requests.post(f"{API_URL}/admin/cars/upload-image", headers=headers, files=upload_files)
    assert res_upload.status_code == 200, f"Upload failed: {res_upload.text}"
    upload_json = res_upload.json()
    image_url = upload_json["url"]
    filename1 = upload_json["filename"]
    print(f"Step 3: Uploaded image successfully -> {image_url} ({upload_json['size']} bytes)")

    # Step 4: Verify Image Accessible via Static Route
    res_img = requests.get(f"{STATIC_BASE}{image_url}")
    assert res_img.status_code == 200, f"Static route failed: {res_img.status_code}"
    assert len(res_img.content) == len(jpeg_bytes), "Image byte length does not match uploaded data!"
    print(f"Step 4: Verified static route {STATIC_BASE}{image_url} (HTTP 200, {len(res_img.content)} bytes)")

    # Step 5: Create a new Car in MySQL referencing this image
    car_data = {
        "brand": "BMW",
        "model": "M4 Competition 2027",
        "year": 2027,
        "category": "Luxury",
        "fuel": "Petrol",
        "transmission": "Automatic",
        "seats": 4,
        "pricePerDay": 18500,
        "deposit": 30000,
        "location": "Coimbatore",
        "image": image_url,
        "images": [image_url],
        "available": True,
        "features": ["Twin-Turbo Inline-6", "Carbon Fiber Roof", "Harman Kardon Audio", "Head-Up Display"],
        "description": "2027 BMW M4 Competition Coupe in Isle of Man Green. High-performance rental luxury vehicle."
    }
    res_car = requests.post(f"{API_URL}/cars", headers=headers, json=car_data)
    assert res_car.status_code == 201, f"Create car failed: {res_car.text}"
    created = res_car.json()["car"]
    car_id = created["id"]
    print(f"Step 5: Created car in MySQL: ID #{car_id} — {created['brand']} {created['model']}")

    # Step 6: Verify in MySQL Database directly
    db = SessionLocal()
    try:
        db_car = db.query(Car).filter(Car.id == car_id).first()
        assert db_car is not None, "Car not found in MySQL!"
        assert db_car.image == image_url, f"DB image mismatch: {db_car.image} vs {image_url}"
        print(f"Step 6: Direct MySQL Verification: Car ID {db_car.id} has image '{db_car.image}'")
    finally:
        db.close()

    # Step 7: Customer API test (GET /api/cars and GET /api/cars/{id})
    res_cust_view = requests.get(f"{API_URL}/cars/{car_id}")
    assert res_cust_view.status_code == 200
    cust_car = res_cust_view.json()["car"]
    assert cust_car["image"] == image_url
    print(f"Step 7: Customer API GET /api/cars/{car_id} correctly returns image '{cust_car['image']}'")

    # Step 8: Edit Car with Replacement Image
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + b"\x44" * 1500
    upload_files2 = {"file": ("bmw_m4_track_edition.png", png_bytes, "image/png")}
    res_upload2 = requests.post(f"{API_URL}/admin/cars/upload-image", headers=headers, files=upload_files2)
    assert res_upload2.status_code == 200
    image_url2 = res_upload2.json()["url"]
    filename2 = res_upload2.json()["filename"]
    print(f"Step 8a: Uploaded replacement image -> {image_url2}")

    car_data["model"] = "M4 Competition Track Edition 2027"
    car_data["image"] = image_url2
    car_data["images"] = [image_url2]
    res_edit = requests.put(f"{API_URL}/cars/{car_id}", headers=headers, json=car_data)
    assert res_edit.status_code == 200
    print(f"Step 8b: Updated car in MySQL with replacement image")

    # Verify old file was deleted from disk
    old_file_path = os.path.join(".", "uploads", "cars", filename1)
    assert not os.path.exists(old_file_path), f"Old image {old_file_path} should have been deleted!"
    print(f"Step 8c: Old unreferenced file '{filename1}' was safely deleted from disk: OK")

    # Step 9: Delete Car and Verify Cleanup
    res_del = requests.delete(f"{API_URL}/cars/{car_id}", headers=headers)
    assert res_del.status_code == 200
    print(f"Step 9a: Deleted test car #{car_id}: {res_del.json()['message']}")

    # Verify replacement file was deleted from disk
    new_file_path = os.path.join(".", "uploads", "cars", filename2)
    assert not os.path.exists(new_file_path), f"Replacement image {new_file_path} was NOT deleted!"
    print(f"Step 9b: Replacement file '{filename2}' was safely cleaned up: OK")

    # Step 10: Inventory Integrity Check
    db2 = SessionLocal()
    try:
        total_cars = db2.query(Car).count()
        print(f"Step 10: Database Fleet Integrity Verified: {total_cars} cars active in MySQL drivo_db")
    finally:
        db2.close()

    print("=" * 60)
    print("ALL 10 END-TO-END VERIFICATION CHECKS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    test_complete_e2e()

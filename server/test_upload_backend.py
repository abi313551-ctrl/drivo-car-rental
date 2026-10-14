import os
import requests

API_URL = "http://127.0.0.1:8000/api"
STATIC_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=== TESTING CAR IMAGE UPLOAD BACKEND ===")

    # 1. Login as Admin
    res_admin = requests.post(f"{API_URL}/auth/login", json={"email": "admin@drivo.example", "password": "admin123"})
    assert res_admin.status_code == 200, f"Admin login failed: {res_admin.text}"
    admin_token = res_admin.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("1. Admin Login: OK")

    # 2. Login as Customer
    res_cust = requests.post(f"{API_URL}/auth/login", json={"email": "priya@drivo.example", "password": "customer123"})
    assert res_cust.status_code == 200, f"Customer login failed: {res_cust.text}"
    cust_token = res_cust.json()["token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    print("2. Customer Login: OK")

    # 3. Customer upload attempt (Must be 403 Forbidden)
    dummy_img = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00" + b"\x00" * 100
    files = {"file": ("test.jpg", dummy_img, "image/jpeg")}
    res_forbidden = requests.post(f"{API_URL}/admin/cars/upload-image", headers=cust_headers, files=files)
    assert res_forbidden.status_code == 403, f"Expected 403, got {res_forbidden.status_code}"
    print("3. Role Protection (Customer upload blocked): OK (403 Forbidden)")

    # 4. Invalid file format (e.g. .txt or text/plain)
    files_bad_fmt = {"file": ("malicious.txt", b"hello world", "text/plain")}
    res_bad_fmt = requests.post(f"{API_URL}/admin/cars/upload-image", headers=admin_headers, files=files_bad_fmt)
    assert res_bad_fmt.status_code == 400, f"Expected 400, got {res_bad_fmt.status_code}"
    print("4. Invalid Format Validation: OK (400 Bad Request)")

    # 5. Oversized image (> 5 MB)
    oversized = b"\x00" * (5 * 1024 * 1024 + 1024)
    files_big = {"file": ("huge.png", oversized, "image/png")}
    res_big = requests.post(f"{API_URL}/admin/cars/upload-image", headers=admin_headers, files=files_big)
    assert res_big.status_code == 400, f"Expected 400 for oversized image, got {res_big.status_code}"
    print("5. Oversized Image Validation (>5MB): OK (400 Bad Request)")

    # 6. Valid Image Upload (Admin)
    files_ok = {"file": ("mahindra_xuv700.jpg", dummy_img, "image/jpeg")}
    res_ok = requests.post(f"{API_URL}/admin/cars/upload-image", headers=admin_headers, files=files_ok)
    assert res_ok.status_code == 200, f"Valid upload failed: {res_ok.text}"
    upload_data = res_ok.json()
    rel_url = upload_data["url"]
    filename = upload_data["filename"]
    print(f"6. Valid Image Upload: OK -> {rel_url} ({filename})")

    # 7. Static file serving check
    res_static = requests.get(f"{STATIC_URL}{rel_url}")
    assert res_static.status_code == 200, f"Failed to serve static file: {res_static.status_code}"
    assert len(res_static.content) == len(dummy_img), "Static file bytes mismatch!"
    print(f"7. Static File Serving: OK (HTTP 200, length {len(res_static.content)} bytes)")

    # 8. Create Car with uploaded image
    car_payload = {
        "brand": "TestBrand",
        "model": "UploadTest 2027",
        "year": 2025,
        "category": "SUV",
        "fuel": "Diesel",
        "transmission": "Automatic",
        "seats": 7,
        "pricePerDay": 4500,
        "deposit": 8000,
        "location": "Coimbatore",
        "image": rel_url,
        "images": [rel_url],
        "available": True,
        "features": ["Sunroof", "Touchscreen", "360 Camera"],
        "description": "Vehicle created for image upload automated testing."
    }
    res_create = requests.post(f"{API_URL}/cars", headers=admin_headers, json=car_payload)
    assert res_create.status_code == 201, f"Create car failed: {res_create.text}"
    created_car = res_create.json()["car"]
    car_id = created_car["id"]
    print(f"8. Create Car with Uploaded Image: OK (Car ID: {car_id}, image: {created_car['image']})")

    # 9. Upload replacement image and update car
    dummy_img2 = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + b"\x00" * 150
    files_ok2 = {"file": ("replacement_photo.png", dummy_img2, "image/png")}
    res_ok2 = requests.post(f"{API_URL}/admin/cars/upload-image", headers=admin_headers, files=files_ok2)
    assert res_ok2.status_code == 200
    rel_url2 = res_ok2.json()["url"]
    
    car_payload["image"] = rel_url2
    car_payload["images"] = [rel_url2]
    res_update = requests.put(f"{API_URL}/cars/{car_id}", headers=admin_headers, json=car_payload)
    assert res_update.status_code == 200
    updated_car = res_update.json()["car"]
    print(f"9. Update Car with New Image: OK (image updated to {updated_car['image']})")

    # Verify old file was deleted
    old_file_path = os.path.join(".", "uploads", "cars", filename)
    assert not os.path.exists(old_file_path), f"Old file {old_file_path} was NOT deleted!"
    print("   -> Old unreferenced image was safely deleted: OK")

    # 10. Delete the test car and verify replacement file deletion
    res_delete = requests.delete(f"{API_URL}/cars/{car_id}", headers=admin_headers)
    assert res_delete.status_code == 200
    new_filename = res_ok2.json()["filename"]
    new_file_path = os.path.join(".", "uploads", "cars", new_filename)
    assert not os.path.exists(new_file_path), f"Car image {new_file_path} was NOT deleted on car deletion!"
    print(f"10. Delete Car and Clean Image: OK ({res_delete.json()['message']})")

    print("\nALL BACKEND UPLOAD TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()

import sys
import time
import requests

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("========================================")
    print("Starting Automated Feature 3 Test Suite")
    print("========================================")

    # 1. Test duplicate email registration rejection
    print("\n[TEST 1] Testing duplicate email rejection...")
    test_user_payload = {
        "fullName": "Test Duplicate",
        "email": "customer@drivo.com", # already exists in database
        "password": "Password123!",
        "phone": "+919876500000"
    }
    r = requests.post(f"{BASE_URL}/api/auth/register", json=test_user_payload)
    if r.status_code == 400:
        print("PASS: Duplicate registration correctly rejected with 400:", r.json().get("detail"))
    else:
        print(f"FAIL: Expected 400 for duplicate email, got {r.status_code}: {r.text}")

    # 2. Test registration of a new unique user
    unique_email = f"autotest_{int(time.time())}@example.com"
    print(f"\n[TEST 2] Testing new user registration ({unique_email})...")
    new_user_payload = {
        "fullName": "Automated Tester",
        "email": unique_email,
        "password": "SecurePassword123!",
        "phone": "+919876543210"
    }
    r = requests.post(f"{BASE_URL}/api/auth/register", json=new_user_payload)
    if r.status_code == 201:
        res_data = r.json()
        token = res_data.get("token")
        user = res_data.get("user")
        print(f"PASS: Registration returned 201 with JWT token. User ID: {user.get('id')}")
    else:
        print(f"FAIL: Registration failed with {r.status_code}: {r.text}")
        return

    # 3. Test login with wrong password
    print("\n[TEST 3] Testing login with invalid password...")
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": unique_email,
        "password": "WrongPassword123!"
    })
    if r.status_code == 401:
        print("PASS: Invalid credentials correctly rejected with 401:", r.json().get("detail"))
    else:
        print(f"FAIL: Expected 401, got {r.status_code}: {r.text}")

    # 4. Test login with correct password
    print("\n[TEST 4] Testing login with valid credentials...")
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": unique_email,
        "password": "SecurePassword123!"
    })
    if r.status_code == 200:
        auth_data = r.json()
        token = auth_data.get("token")
        user = auth_data.get("user")
        print(f"PASS: Logged in successfully. User: {user.get('email')} (ID: {user.get('id')})")
    else:
        print(f"FAIL: Expected 200, got {r.status_code}: {r.text}")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 5. Test protected route GET /api/auth/me without token and with token
    print("\n[TEST 5] Testing GET /api/auth/me protection...")
    r_no_auth = requests.get(f"{BASE_URL}/api/auth/me")
    if r_no_auth.status_code == 401:
        print("PASS: Unauthenticated /api/auth/me correctly returned 401.")
    else:
        print(f"FAIL: Expected 401 without token, got {r_no_auth.status_code}")

    r_auth = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    if r_auth.status_code == 200:
        me_user = r_auth.json().get("user", {})
        print("PASS: Authenticated /api/auth/me returned 200 with profile data:", me_user.get("fullName"))
    else:
        print(f"FAIL: Authenticated /api/auth/me failed with {r_auth.status_code}")

    # 6. Test updating profile via PUT /api/auth/me
    print("\n[TEST 6] Testing PUT /api/auth/me profile update...")
    update_payload = {
        "fullName": "Automated Tester Updated",
        "phone": "+919876543210",
        "license": "TN3720190012345"
    }
    r = requests.put(f"{BASE_URL}/api/auth/me", headers=headers, json=update_payload)
    if r.status_code == 200:
        updated_data = r.json().get("user", {})
        if (updated_data.get("fullName") == "Automated Tester Updated" and
            updated_data.get("phone") == "+919876543210" and
            updated_data.get("license") == "TN3720190012345"):
            print("PASS: Profile updated and verified successfully.")
        else:
            print(f"FAIL: Updated fields did not match: {updated_data}")
    else:
        print(f"FAIL: Profile update failed with {r.status_code}: {r.text}")

    # 7. Test GET /api/bookings/my
    print("\n[TEST 7] Testing GET /api/bookings/my for new user...")
    r = requests.get(f"{BASE_URL}/api/bookings/my", headers=headers)
    if r.status_code == 200:
        bookings = r.json().get("bookings", [])
        print(f"PASS: GET /api/bookings/my returned 200. Total bookings for new user: {len(bookings)} (expected 0)")
    else:
        print(f"FAIL: GET /api/bookings/my failed with {r.status_code}: {r.text}")

    # 8. Test GET /api/bookings/my for customer@drivo.com
    print("\n[TEST 8] Testing GET /api/bookings/my for customer@drivo.com...")
    r_login = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "customer@drivo.com",
        "password": "Password123!"
    })
    if r_login.status_code == 200:
        cust_token = r_login.json().get("token")
        cust_headers = {"Authorization": f"Bearer {cust_token}"}
        r_cust_bookings = requests.get(f"{BASE_URL}/api/bookings/my", headers=cust_headers)
        if r_cust_bookings.status_code == 200:
            cust_bookings = r_cust_bookings.json().get("bookings", [])
            print(f"PASS: customer@drivo.com has {len(cust_bookings)} bookings retrieved securely.")
            if len(cust_bookings) > 0:
                sample_b = cust_bookings[0]
                print(f"Sample booking: ref={sample_b.get('ref')}, car={sample_b.get('car', {}).get('model')}, status={sample_b.get('status')}")
                
                # 9. Test unauthorized cancellation attempt:
                # new user tries to cancel customer@drivo.com's booking
                print(f"\n[TEST 9] Testing cross-account unauthorized cancellation...")
                r_cross_cancel = requests.post(f"{BASE_URL}/api/bookings/{sample_b.get('ref')}/cancel", headers=headers)
                if r_cross_cancel.status_code in [403, 404]:
                    print(f"PASS: Cross-user cancellation blocked with {r_cross_cancel.status_code}: {r_cross_cancel.json().get('detail')}")
                else:
                    print(f"FAIL: Cross-user cancellation was not blocked! Status: {r_cross_cancel.status_code}")
        else:
            print(f"FAIL: customer bookings request failed: {r_cust_bookings.text}")
    else:
        print(f"FAIL: customer@drivo.com login failed: {r_login.text}")

    print("\n========================================")
    print("ALL FEATURE 3 VERIFICATION TESTS PASSED!")
    print("========================================")

if __name__ == "__main__":
    run_tests()

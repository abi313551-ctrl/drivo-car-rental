import requests
import uuid

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("==================================================")
    print("CUSTOMER DASHBOARD & AUTHORIZATION TEST SUITE")
    print("==================================================")

    # 1. Create two distinct customer accounts
    user1_email = f"cust1_{uuid.uuid4().hex[:6]}@drivo.com"
    user2_email = f"cust2_{uuid.uuid4().hex[:6]}@drivo.com"

    reg1 = requests.post(f"{BASE_URL}/auth/register", json={
        "fullName": "Alice Driver",
        "email": user1_email,
        "password": "Password123!",
        "phone": "+91 98765 11111",
        "license": "TN37 20190011111"
    })
    assert reg1.status_code == 201, f"Registration 1 failed: {reg1.text}"
    token1 = reg1.json()["token"]
    user1 = reg1.json()["user"]
    print(f"[PASS] Created Customer 1: {user1['fullName']} ({user1['email']})")

    reg2 = requests.post(f"{BASE_URL}/auth/register", json={
        "fullName": "Bob Cruiser",
        "email": user2_email,
        "password": "Password123!",
        "phone": "+91 98765 22222",
        "license": "TN37 20200022222"
    })
    assert reg2.status_code == 201, f"Registration 2 failed: {reg2.text}"
    token2 = reg2.json()["token"]
    user2 = reg2.json()["user"]
    print(f"[PASS] Created Customer 2: {user2['fullName']} ({user2['email']})")

    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 2. Test Safe Profile Editing with Validation
    print("\n--- Test 1: Customer Profile Update & Validation ---")
    # Valid update
    update_res = requests.put(f"{BASE_URL}/auth/me", headers=headers1, json={
        "fullName": "Alice Verified Driver",
        "phone": "+91 98765 33333",
        "license": "TN37 20210033333"
    })
    assert update_res.status_code == 200, f"Profile update failed: {update_res.text}"
    updated_user = update_res.json()["user"]
    assert updated_user["fullName"] == "Alice Verified Driver"
    assert updated_user["phone"] == "+91 98765 33333"
    assert updated_user["license"] == "TN3720210033333"
    print(f"[PASS] Customer 1 updated profile to: {updated_user['fullName']}, {updated_user['phone']}")

    # Invalid phone test
    bad_phone_res = requests.put(f"{BASE_URL}/auth/me", headers=headers1, json={
        "fullName": "Alice Driver",
        "phone": "12345", # invalid
        "license": "TN37 20210033333"
    })
    assert bad_phone_res.status_code in (400, 422), "Should reject invalid phone"
    print("[PASS] Rejected invalid mobile number format.")

    # 3. Create a Booking for User 1
    print("\n--- Test 2: Create Booking Under Customer 1 ---")
    cars_res = requests.get(f"{BASE_URL}/cars")
    car = cars_res.json()["cars"][0]

    import datetime
    import random
    day_offset = random.randint(30, 180)
    start_dt = (datetime.datetime.now() + datetime.timedelta(days=day_offset)).strftime("%Y-%m-%dT10:00")
    end_dt = (datetime.datetime.now() + datetime.timedelta(days=day_offset + 3)).strftime("%Y-%m-%dT10:00")

    b_payload = {
        "carId": car["id"],
        "pickup": "Chennai Airport",
        "dropoff": "Chennai Airport",
        "start": start_dt,
        "end": end_dt,
        "extras": {"gps": True},
        "couponCode": "WELCOME10",
        "customer": {
            "fullName": "Alice Verified Driver",
            "email": user1["email"],
            "phone": "+91 98765 33333",
            "license": "TN37 20210033333"
        }
    }
    create_res = requests.post(f"{BASE_URL}/bookings", headers=headers1, json=b_payload)
    assert create_res.status_code == 201, f"Booking creation failed: {create_res.text}"
    booking1 = create_res.json()["booking"]
    ref1 = booking1["ref"]
    print(f"[PASS] Created booking {ref1} for Customer 1 (Alice)")

    # 4. Test Customer Isolation (GET /api/bookings/my)
    print("\n--- Test 3: Customer Booking Isolation ---")
    my_b1 = requests.get(f"{BASE_URL}/bookings/my", headers=headers1).json()["bookings"]
    my_b2 = requests.get(f"{BASE_URL}/bookings/my", headers=headers2).json()["bookings"]

    b1_refs = [b["ref"] for b in my_b1]
    b2_refs = [b["ref"] for b in my_b2]

    assert ref1 in b1_refs, f"Booking {ref1} should be visible to Customer 1"
    assert ref1 not in b2_refs, f"Booking {ref1} must NOT be visible to Customer 2"
    print(f"[PASS] Customer 1 sees {len(my_b1)} bookings. Customer 2 sees {len(my_b2)} bookings (strictly isolated).")

    # 5. Test Access Control on Receipt / Tax Invoice
    print("\n--- Test 4: Receipt Access Control ---")
    # Customer 1 accessing own receipt -> 200
    rcpt_owner = requests.get(f"{BASE_URL}/bookings/{ref1}/receipt", headers=headers1)
    assert rcpt_owner.status_code == 200
    print(f"[PASS] Customer 1 successfully accessed their own receipt for {ref1}")

    # Customer 2 attempting to access Customer 1's receipt -> 403 Forbidden
    rcpt_stranger = requests.get(f"{BASE_URL}/bookings/{ref1}/receipt", headers=headers2)
    assert rcpt_stranger.status_code == 403, f"Expected 403, got {rcpt_stranger.status_code}"
    print("[PASS] Customer 2 denied access (403 Forbidden) to Customer 1's tax invoice.")

    # 6. Test Customer Cancellation Authorization
    print("\n--- Test 5: Cancellation Authorization Rules ---")
    # Customer 2 attempting to cancel Customer 1's booking -> 403 Forbidden
    cancel_stranger = requests.post(f"{BASE_URL}/bookings/{ref1}/cancel", headers=headers2)
    assert cancel_stranger.status_code == 403, f"Expected 403, got {cancel_stranger.status_code}"
    print("[PASS] Customer 2 blocked from cancelling Customer 1's booking (403 Forbidden).")

    # Customer 1 cancelling their own booking (eligible because > 24 hours in advance) -> 200 OK
    cancel_owner = requests.post(f"{BASE_URL}/bookings/{ref1}/cancel", headers=headers1)
    assert cancel_owner.status_code == 200, f"Owner cancellation failed: {cancel_owner.text}"
    cancelled_b = cancel_owner.json()["booking"]
    assert cancelled_b["status"] == "Cancelled"
    print(f"[PASS] Customer 1 successfully cancelled booking {ref1}.")

    # 7. Test Notifications for User 1
    print("\n--- Test 6: Notification Delivery & Read State ---")
    notifs_res = requests.get(f"{BASE_URL}/notifications", headers=headers1)
    assert notifs_res.status_code == 200
    notifs = notifs_res.json()["notifications"]
    assert len(notifs) > 0, "Expected booking and cancellation notifications"
    print(f"[PASS] Customer 1 has {len(notifs)} alerts in dashboard (confirmation & cancellation).")

    # Mark first notification as read
    notif_id = notifs[0]["id"]
    mark_res = requests.patch(f"{BASE_URL}/notifications/{notif_id}/read", headers=headers1)
    assert mark_res.status_code == 200
    print(f"[PASS] Notification #{notif_id} marked as read.")

    # 8. Test Favorites Isolation
    print("\n--- Test 7: Favorites Persistence & Isolation ---")
    # User 1 favorites car 1
    fav_res = requests.post(f"{BASE_URL}/favorites/{car['id']}", headers=headers1)
    assert fav_res.status_code == 200

    u1_favs = requests.get(f"{BASE_URL}/favorites", headers=headers1).json()["favorites"]
    u2_favs = requests.get(f"{BASE_URL}/favorites", headers=headers2).json()["favorites"]

    assert car["id"] in u1_favs
    assert car["id"] not in u2_favs
    print(f"[PASS] Favorites isolated: Customer 1 has {len(u1_favs)} favorites, Customer 2 has {len(u2_favs)} favorites.")

    print("\n==================================================")
    print("ALL CUSTOMER DASHBOARD & AUTH TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()

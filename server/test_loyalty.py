import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=== Testing Drivo Loyalty & Rewards Points System ===")

    # 1. Health check
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] Health check ok")

    # 2. Get Loyalty Config
    res = requests.get(f"{BASE_URL}/loyalty/config")
    assert res.status_code == 200, f"Get config failed: {res.text}"
    cfg = res.json()["config"]
    assert cfg["pointsPer100Inr"] == 1.0
    assert cfg["redemptionValueInr"] == 1.0
    print(f"[PASS] Loyalty config verified: 1 pt per Rs 100 spend, 1 pt = Rs {cfg['redemptionValueInr']}")

    # 3. Authenticate Admin
    admin_login = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@drivo.example", "password": "password123"},
    )
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[PASS] Admin authentication successful")

    # 4. Authenticate Customer
    cust_login = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "priya@drivo.example", "password": "password123"},
    )
    assert cust_login.status_code == 200, f"Customer login failed: {cust_login.text}"
    cust_token = cust_login.json()["token"]
    cust_id = cust_login.json()["user"]["id"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    print(f"[PASS] Customer Priya (ID: {cust_id}) authenticated")

    # 5. Customer Loyalty Summary
    res = requests.get(f"{BASE_URL}/loyalty/my", headers=cust_headers)
    assert res.status_code == 200, f"Customer loyalty summary failed: {res.text}"
    my_loyalty = res.json()
    print(f"[PASS] Customer loyalty profile: {my_loyalty['rewardPoints']} pts, Tier: {my_loyalty['tier']}")

    # 6. Admin Manual Points Adjustment (Credit 150 points for testing)
    adjust_res = requests.post(
        f"{BASE_URL}/admin/loyalty/adjust",
        headers=admin_headers,
        json={"userId": cust_id, "points": 150, "reason": "Welcome loyalty bonus test"},
    )
    assert adjust_res.status_code == 200, f"Points adjustment failed: {adjust_res.text}"
    updated_user = adjust_res.json()["user"]
    print(f"[PASS] Admin adjustment credited 150 points. New balance: {updated_user['rewardPoints']}")

    # Verify Customer sees new balance
    res = requests.get(f"{BASE_URL}/loyalty/my", headers=cust_headers)
    assert res.status_code == 200
    my_loyalty = res.json()
    assert my_loyalty["rewardPoints"] >= 150
    print(f"[PASS] Customer balance verified: {my_loyalty['rewardPoints']} pts")

    # 7. Test Price Calculation with Points Redemption
    calc_res = requests.post(
        f"{BASE_URL}/pricing/calculate",
        headers=cust_headers,
        json={
            "carId": 1,
            "start": "2026-11-20T10:00",
            "end": "2026-11-22T10:00",
            "redeemPoints": 100,
        },
    )
    assert calc_res.status_code == 200, f"Price calculation failed: {calc_res.text}"
    pricing = calc_res.json()["pricing"]
    assert pricing["pointsRedeemed"] == 100
    assert pricing["pointsDiscount"] == 100
    print(f"[PASS] Smart calculator applied {pricing['pointsRedeemed']} pts for Rs {pricing['pointsDiscount']} discount")

    # 8. Create Booking Redeeming 100 Points
    book_res = requests.post(
        f"{BASE_URL}/bookings",
        headers=cust_headers,
        json={
            "carId": 1,
            "pickup": "Bengaluru Airport Terminal 1 Hub",
            "dropoff": "Bengaluru Airport Terminal 1 Hub",
            "start": "2026-11-20T10:00",
            "end": "2026-11-22T10:00",
            "redeemPoints": 100,
            "customer": {
                "fullName": "Priya Sharma",
                "email": "priya@drivo.example",
                "phone": "9876543210",
                "license": "KA0120190012345",
            },
        },
    )
    assert book_res.status_code == 201, f"Booking creation failed: {book_res.text}"
    b_data = book_res.json()["booking"]
    booking_ref = b_data["ref"]
    booking_id = b_data["id"]
    print(f"[PASS] Created booking {booking_ref} with 100 points redeemed")

    # Verify Customer balance decreased by 100
    res = requests.get(f"{BASE_URL}/loyalty/my", headers=cust_headers)
    assert res.status_code == 200
    post_book_loyalty = res.json()
    assert post_book_loyalty["rewardPoints"] == my_loyalty["rewardPoints"] - 100
    print(f"[PASS] Customer balance decreased from {my_loyalty['rewardPoints']} to {post_book_loyalty['rewardPoints']}")

    # 9. Test Ineligible Booking (Pending/Unpaid) Does Not Earn Points
    # Status is Confirmed, but not Completed
    res = requests.get(f"{BASE_URL}/loyalty/my", headers=cust_headers)
    assert res.json()["rewardPoints"] == post_book_loyalty["rewardPoints"]
    print("[PASS] Active/uncompleted booking has not awarded points yet")

    # 10. Complete Booking and Verify Points Earning
    # Admin marks booking as Completed and Paid
    status_res = requests.patch(
        f"{BASE_URL}/admin/bookings/{booking_id}/status",
        headers=admin_headers,
        json={"status": "Completed", "paymentStatus": "Paid"},
    )
    assert status_res.status_code == 200, f"Booking status update failed: {status_res.text}"

    # Verify points were awarded!
    res = requests.get(f"{BASE_URL}/loyalty/my", headers=cust_headers)
    assert res.status_code == 200
    after_complete_loyalty = res.json()
    earned_pts = after_complete_loyalty["rewardPoints"] - post_book_loyalty["rewardPoints"]
    assert earned_pts > 0, f"Expected points to be awarded, but got diff: {earned_pts}"
    print(f"[PASS] Successfully earned {earned_pts} points upon trip completion! Balance now: {after_complete_loyalty['rewardPoints']}")

    # 11. Test Duplicate Reward Prevention: Mark Completed Again
    status_res2 = requests.patch(
        f"{BASE_URL}/admin/bookings/{booking_id}/status",
        headers=admin_headers,
        json={"status": "Completed", "paymentStatus": "Paid"},
    )
    assert status_res2.status_code == 200
    res2 = requests.get(f"{BASE_URL}/loyalty/my", headers=cust_headers)
    assert res2.json()["rewardPoints"] == after_complete_loyalty["rewardPoints"]
    print("[PASS] Duplicate reward prevention verified: No extra points awarded on re-completion")

    # 12. Test Cancellation & Points Refund
    # Let's create a future booking with points redeemed and cancel it
    book_cancel = requests.post(
        f"{BASE_URL}/bookings",
        headers=cust_headers,
        json={
            "carId": 1,
            "pickup": "Bengaluru Airport Terminal 1 Hub",
            "dropoff": "Bengaluru Airport Terminal 1 Hub",
            "start": "2026-11-25T10:00",
            "end": "2026-11-27T10:00",
            "redeemPoints": 50,
            "customer": {
                "fullName": "Priya Sharma",
                "email": "priya@drivo.example",
                "phone": "9876543210",
                "license": "KA0120190012345",
            },
        },
    )
    assert book_cancel.status_code == 201
    cancel_ref = book_cancel.json()["booking"]["ref"]
    cancel_id = book_cancel.json()["booking"]["id"]
    print(f"[PASS] Created booking {cancel_ref} with 50 points redeemed")

    # Cancel the booking
    cancel_res = requests.post(
        f"{BASE_URL}/bookings/{cancel_ref}/cancel",
        headers=cust_headers,
    )
    assert cancel_res.status_code == 200, f"Cancellation failed: {cancel_res.text}"

    # Verify the 50 points were refunded!
    res = requests.get(f"{BASE_URL}/loyalty/my", headers=cust_headers)
    refund_tx = [t for t in res.json()["transactions"] if t["bookingRef"] == cancel_ref and t["transactionType"] == "refunded"]
    assert len(refund_tx) > 0, "Expected refunded transaction in ledger"
    assert refund_tx[0]["points"] == 50
    print(f"[PASS] Cancelled booking {cancel_ref} automatically refunded 50 redeemed points to customer ledger")

    # 13. Test Admin Loyalty Transactions View
    admin_txs_res = requests.get(f"{BASE_URL}/admin/loyalty/transactions", headers=admin_headers)
    assert admin_txs_res.status_code == 200
    admin_txs_data = admin_txs_res.json()
    assert admin_txs_data["ok"] is True
    assert len(admin_txs_data["transactions"]) >= 3
    print(f"[PASS] Admin transactions endpoint verified ({len(admin_txs_data['transactions'])} transactions in audit ledger)")

    # 14. Test Admin Loyalty Config Update
    config_update_res = requests.put(
        f"{BASE_URL}/admin/loyalty/config",
        headers=admin_headers,
        json={
            "pointsPer100Inr": 2.0,
            "redemptionValueInr": 1.0,
            "minPointsToRedeem": 50,
            "maxDiscountPercent": 35,
            "silverThreshold": 0,
            "goldThreshold": 400,
            "platinumThreshold": 1200,
            "goldMultiplier": 1.25,
            "platinumMultiplier": 1.5,
            "isActive": True,
        },
    )
    assert config_update_res.status_code == 200
    updated_cfg = config_update_res.json()["config"]
    assert updated_cfg["pointsPer100Inr"] == 2.0
    print("[PASS] Admin updated loyalty configuration successfully")

    # Restore default 1.0 rate
    requests.put(
        f"{BASE_URL}/admin/loyalty/config",
        headers=admin_headers,
        json={
            "pointsPer100Inr": 1.0,
            "redemptionValueInr": 1.0,
            "minPointsToRedeem": 50,
            "maxDiscountPercent": 30,
            "silverThreshold": 0,
            "goldThreshold": 300,
            "platinumThreshold": 1000,
            "goldMultiplier": 1.25,
            "platinumMultiplier": 1.5,
            "isActive": True,
        },
    )

    print("\nALL 14 LOYALTY & REWARDS TESTS PASSED SUCCESSFULLY! :)")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n[FAIL] Test failed with error: {e}")
        sys.exit(1)

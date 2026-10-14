import os
import sys
import json
import urllib.request
import urllib.error

def run_tests():
    print("=== PHASE 2 BACKEND VERIFICATION ===")
    
    # 1. Admin login
    admin_login_url = "http://127.0.0.1:8000/api/auth/login"
    payload = json.dumps({"email": "admin@drivo.example", "password": "admin123"}).encode('utf-8')
    req = urllib.request.Request(admin_login_url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        admin_data = json.loads(resp.read().decode('utf-8'))
        admin_token = admin_data["token"]
        print("1. Admin Login: OK (role:", admin_data["user"]["role"], ")")
        assert admin_data["user"]["role"] == "admin"

    # 2. Customer login
    cust_login_url = "http://127.0.0.1:8000/api/auth/login"
    payload = json.dumps({"email": "priya@drivo.example", "password": "customer123"}).encode('utf-8')
    req = urllib.request.Request(cust_login_url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        cust_data = json.loads(resp.read().decode('utf-8'))
        cust_token = cust_data["token"]
        print("2. Customer Login: OK (role:", cust_data["user"]["role"], ")")
        assert cust_data["user"]["role"] == "customer"

    # 3. Admin stats endpoint
    stats_url = "http://127.0.0.1:8000/api/admin/stats"
    req = urllib.request.Request(stats_url, headers={"Authorization": f"Bearer {admin_token}"})
    with urllib.request.urlopen(req) as resp:
        stats = json.loads(resp.read().decode('utf-8'))
        print("3. Admin Stats (Authorized):", stats)
        assert stats["totalCars"] >= 90
        assert stats["totalUsers"] >= 2

    # 4. Customer trying to access Admin stats (must be 403 Forbidden)
    req = urllib.request.Request(stats_url, headers={"Authorization": f"Bearer {cust_token}"})
    try:
        urllib.request.urlopen(req)
        raise AssertionError("Customer should NOT have access to /api/admin/stats")
    except urllib.error.HTTPError as e:
        print(f"4. Customer Forbidden Check: OK (HTTP {e.code} Forbidden)")
        assert e.code == 403

    # 5. Coupon validation endpoint
    coupon_url = "http://127.0.0.1:8000/api/coupons/validate"
    payload = json.dumps({
        "code": "WELCOME10",
        "carId": 1,
        "start": "2026-11-10T10:00:00",
        "end": "2026-11-12T10:00:00",
        "extras": {}
    }).encode('utf-8')
    req = urllib.request.Request(coupon_url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        c_res = json.loads(resp.read().decode('utf-8'))
        print("5. Coupon Validation (WELCOME10): OK (Discount: INR", c_res["discount"], ")")
        assert c_res["ok"] is True
        assert c_res["discount"] > 0

    # 6. Receipt / Invoice endpoint
    bookings_url = "http://127.0.0.1:8000/api/bookings"
    with urllib.request.urlopen(bookings_url) as resp:
        b_list = json.loads(resp.read().decode('utf-8'))["bookings"]
        assert len(b_list) > 0
        first_ref = b_list[0]["ref"]
        first_id = b_list[0]["id"]
    
    receipt_url = f"http://127.0.0.1:8000/api/bookings/{first_ref}/receipt"
    with urllib.request.urlopen(receipt_url) as resp:
        rec = json.loads(resp.read().decode('utf-8'))["receipt"]
        print("6. Receipt Generation:", rec["invoiceNumber"], "| Vehicle:", rec["vehicle"]["name"], "| Total: INR", rec["charges"]["totalAmount"])
        assert rec["invoiceNumber"].startswith("INV-")

    # 7. Customer Notifications endpoint
    notif_url = "http://127.0.0.1:8000/api/notifications"
    req = urllib.request.Request(notif_url, headers={"Authorization": f"Bearer {cust_token}"})
    with urllib.request.urlopen(req) as resp:
        notifs = json.loads(resp.read().decode('utf-8'))["notifications"]
        print("7. Customer Notifications count:", len(notifs))

    # 8. Admin update booking status
    status_url = f"http://127.0.0.1:8000/api/admin/bookings/{first_id}/status"
    payload = json.dumps({"status": "Confirmed", "paymentStatus": "Paid"}).encode('utf-8')
    req = urllib.request.Request(status_url, data=payload, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_token}"
    }, method="PATCH")
    with urllib.request.urlopen(req) as resp:
        up_b = json.loads(resp.read().decode('utf-8'))["booking"]
        print("8. Admin Status Update: OK (Status:", up_b["status"], "Payment:", up_b["paymentStatus"], ")")
        assert up_b["paymentStatus"] == "Paid"

    # 9. Car reviews endpoint
    reviews_url = "http://127.0.0.1:8000/api/cars/1/reviews"
    with urllib.request.urlopen(reviews_url) as resp:
        revs = json.loads(resp.read().decode('utf-8'))["reviews"]
        print("9. Car 1 Verified Reviews count:", len(revs))

    print("\nALL PHASE 2 BACKEND ENDPOINTS VERIFIED SUCCESSFULLY!")

if __name__ == '__main__':
    run_tests()

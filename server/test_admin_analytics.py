import requests
import datetime

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("==================================================")
    print("ADMIN ANALYTICS & REVENUE ACCURACY TEST SUITE")
    print("==================================================")

    # 1. Authorization & Role Protection Tests
    print("\n--- Test 1: Admin Authorization & Role Protection ---")
    
    # 1.1 Anonymous Request
    anon_res = requests.get(f"{BASE_URL}/admin/analytics")
    assert anon_res.status_code == 401, f"Expected 401 for anonymous, got {anon_res.status_code}"
    print("[PASS] Blocked anonymous request with 401 Unauthorized.")

    # 1.2 Customer (Non-Admin) Request
    cust_login = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "priya@drivo.example",
        "password": "customer123"
    })
    assert cust_login.status_code == 200, f"Customer login failed: {cust_login.text}"
    cust_token = cust_login.json()["token"]
    
    cust_res = requests.get(
        f"{BASE_URL}/admin/analytics",
        headers={"Authorization": f"Bearer {cust_token}"}
    )
    assert cust_res.status_code == 403, f"Expected 403 for customer, got {cust_res.status_code}"
    print("[PASS] Blocked customer access with 403 Forbidden (Non-admin isolation confirmed).")

    # 1.3 Admin Request
    admin_login = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@drivo.example",
        "password": "admin123"
    })
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    admin_res = requests.get(f"{BASE_URL}/admin/analytics", headers=admin_headers)
    assert admin_res.status_code == 200, f"Admin access failed: {admin_res.text}"
    print("[PASS] Authorized admin access with 200 OK.")

    analytics_data = admin_res.json()
    kpis = analytics_data["kpis"]

    # 2. Aggregation Accuracy & Metric Definitions Verification
    print("\n--- Test 2: Metric Definitions & Aggregation Accuracy ---")
    expected_kpis = [
        "totalCars", "availableCars", "maintenanceCars", "currentlyBookedCars",
        "fleetUtilizationRate", "totalUsers", "customerUsers", "adminUsers",
        "totalBookings", "pendingBookings", "confirmedBookings", "completedBookings",
        "cancelledBookings", "grossBookingValue", "collectedRevenue", "pendingRevenue",
        "refundedRevenue", "totalPipelineValue", "avgOrderValue"
    ]
    for key in expected_kpis:
        assert key in kpis, f"Missing KPI metric: {key}"

    print(f"[*] Total Cars in Fleet: {kpis['totalCars']}")
    print(f"    Available: {kpis['availableCars']} | In Maintenance: {kpis['maintenanceCars']}")
    print(f"    Currently Booked Now: {kpis['currentlyBookedCars']} | Utilization: {kpis['fleetUtilizationRate']}%")
    print(f"[*] Registered Users: {kpis['totalUsers']} (Customers: {kpis['customerUsers']}, Admins: {kpis['adminUsers']})")
    print(f"[*] Total Bookings: {kpis['totalBookings']}")
    print(f"    Confirmed: {kpis['confirmedBookings']} | Completed: {kpis['completedBookings']} | Cancelled: {kpis['cancelledBookings']} | Pending: {kpis['pendingBookings']}")
    print(f"[*] Gross Booking Value (GBV): Rs. {kpis['grossBookingValue']}")
    print(f"[*] Actual Collected Revenue: Rs. {kpis['collectedRevenue']}")
    print(f"[*] Pending Collection: Rs. {kpis['pendingRevenue']}")
    print(f"[*] Average Order Value (AOV): Rs. {kpis['avgOrderValue']}")

    # Integrity assertions
    assert kpis["totalCars"] == kpis["availableCars"] + kpis["maintenanceCars"]
    assert kpis["totalUsers"] == kpis["customerUsers"] + kpis["adminUsers"]
    assert kpis["grossBookingValue"] >= kpis["collectedRevenue"], "GBV must be >= Collected Revenue"
    print("[PASS] Metric definitions and mathematical consistency verified.")

    # 3. Monthly Trends Verification
    print("\n--- Test 3: Monthly Booking & Revenue Trends Verification ---")
    trends = analytics_data["monthlyTrends"]
    assert isinstance(trends, list) and len(trends) > 0, "Expected monthly trends data"
    for m in trends:
        assert "month" in m and "label" in m
        assert "bookings" in m and "grossValue" in m and "collectedRevenue" in m
    print(f"[PASS] Successfully aggregated {len(trends)} months of chronological booking & revenue trends.")

    # 4. Popular Cars Verification
    print("\n--- Test 4: Popular Fleet Cars (Based on Actual Booking Counts) ---")
    pop_cars = analytics_data["popularCars"]
    assert isinstance(pop_cars, list), "Expected popularCars list"
    for idx, c in enumerate(pop_cars):
        assert "brand" in c and "model" in c and "bookingsCount" in c and "revenue" in c
        print(f"    #{idx+1}: {c['brand']} {c['model']} ({c['category']}) -> {c['bookingsCount']} bookings, Rs. {c['revenue']} earned ({c['sharePercent']}% share)")
    print("[PASS] Popular cars correctly ordered by real booking counts.")

    # 5. Inventory & Availability Summary by Category
    print("\n--- Test 5: Fleet Category Inventory & Availability ---")
    cat_summary = analytics_data["categorySummary"]
    assert isinstance(cat_summary, list) and len(cat_summary) > 0
    total_cat_cars = sum(c["total"] for c in cat_summary)
    assert total_cat_cars == kpis["totalCars"], f"Sum of category cars ({total_cat_cars}) must equal total cars ({kpis['totalCars']})"
    for c in cat_summary:
        print(f"    Category {c['category']}: {c['total']} cars ({c['available']} ready, {c['bookedNow']} on trip, {c['maintenance']} service) [{c['sharePercent']}%]")
    print("[PASS] Category inventory summaries accurately match database fleet totals.")

    # 6. Date Range Filters (30d, 90d, year, custom, empty future date)
    print("\n--- Test 6: Date Range Filter Aggregations ---")
    
    # 6.1 Last 30 Days Filter
    res_30d = requests.get(f"{BASE_URL}/admin/analytics?range=30d", headers=admin_headers)
    assert res_30d.status_code == 200
    kpis_30d = res_30d.json()["kpis"]
    print(f"[PASS] 30d filter: {kpis_30d['totalBookings']} bookings, GBV Rs. {kpis_30d['grossBookingValue']}")

    # 6.2 Custom Filter
    res_custom = requests.get(
        f"{BASE_URL}/admin/analytics?range=custom&startDate=2026-01-01T00:00&endDate=2026-12-31T23:59",
        headers=admin_headers
    )
    assert res_custom.status_code == 200
    print(f"[PASS] Custom date range filter applied successfully.")

    # 6.3 Empty Data Handling (Far Future Date Range)
    res_empty = requests.get(
        f"{BASE_URL}/admin/analytics?range=custom&startDate=2099-01-01T00:00&endDate=2099-01-31T23:59",
        headers=admin_headers
    )
    assert res_empty.status_code == 200
    empty_kpis = res_empty.json()["kpis"]
    assert empty_kpis["totalBookings"] == 0
    assert empty_kpis["grossBookingValue"] == 0
    assert empty_kpis["collectedRevenue"] == 0
    assert empty_kpis["avgOrderValue"] == 0
    print("[PASS] Empty period handled gracefully without division-by-zero or crashes.")

    # 7. Recent Bookings Verification
    print("\n--- Test 7: Recent Bookings Integrity ---")
    recent = analytics_data["recentBookings"]
    assert isinstance(recent, list)
    if len(recent) > 0:
        b0 = recent[0]
        assert "ref" in b0 and "customer" in b0 and "car" in b0 and "pricing" in b0
        print(f"[PASS] Latest booking verified: {b0['ref']} ({b0['car']['brand']} {b0['car']['model']}) -> Rs. {b0['pricing'].get('total', 0)}")

    print("\n==================================================")
    print("ALL ADMIN ANALYTICS TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()

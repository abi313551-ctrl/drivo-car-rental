"""
Comprehensive Focused Test Suite: Secure Customer and Admin Authentication System
Verifies:
1. Customer Registration & Login with custom credentials
2. Customer Role Enforcement: strict 403 Forbidden on all admin endpoints
3. Customer Booking Access: customer can browse cars and view their own bookings
4. Admin Authentication: administrator account access, JWT generation, and admin APIs
5. Security: invalid credentials rejected with 401 Unauthorized
"""
import sys
import os
import unittest
import time
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app
from database import SessionLocal
import models

class TestSecureAuthSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()
        cls.test_cust_email = f"cust_secure_{int(time.time())}@example.com"
        cls.test_cust_pwd = "CustPassword123!"

    @classmethod
    def tearDownClass(cls):
        # Clean up test customer
        u = cls.db.query(models.User).filter(models.User.email == cls.test_cust_email).first()
        if u:
            # Delete any bookings created by this customer
            bookings = cls.db.query(models.Booking).filter(models.Booking.user_id == u.id).all()
            for b in bookings:
                cls.db.delete(b)
            cls.db.delete(u)
            cls.db.commit()
        cls.db.close()

    def test_01_customer_registration_and_login(self):
        """Test customer registration with personal details, followed by successful login."""
        reg_payload = {
            "fullName": "Kavitha Rajan",
            "email": self.test_cust_email,
            "password": self.test_cust_pwd,
            "phone": "9876543219",
            "license": "TN7420240009999"
        }
        reg_res = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(reg_res.status_code, 201)
        reg_data = reg_res.json()
        self.assertIn("token", reg_data)
        self.assertEqual(reg_data["user"]["role"], "customer")
        self.assertEqual(reg_data["user"]["email"], self.test_cust_email.lower())

        # Test Customer Login
        login_res = self.client.post("/api/auth/login", json={
            "email": self.test_cust_email,
            "password": self.test_cust_pwd
        })
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.json()
        self.assertIn("token", login_data)
        self.assertEqual(login_data["user"]["role"], "customer")
        print("\n[PASS] Customer registration and login succeeded with JWT token and role='customer'.")

    def test_02_customer_strictly_forbidden_from_admin_endpoints(self):
        """Verify customer token is strictly blocked (403 Forbidden) from admin APIs and admin login."""
        login_res = self.client.post("/api/auth/login", json={
            "email": self.test_cust_email,
            "password": self.test_cust_pwd
        })
        cust_token = login_res.json()["token"]
        cust_headers = {"Authorization": f"Bearer {cust_token}"}

        # 1. Customer cannot access /api/admin/stats
        stats_res = self.client.get("/api/admin/stats", headers=cust_headers)
        self.assertEqual(stats_res.status_code, 403)

        # 2. Customer cannot access /api/admin/bookings
        bookings_res = self.client.get("/api/admin/bookings", headers=cust_headers)
        self.assertEqual(bookings_res.status_code, 403)

        # 3. Customer cannot access /api/admin/customers
        customers_res = self.client.get("/api/admin/customers", headers=cust_headers)
        self.assertEqual(customers_res.status_code, 403)

        # 4. Customer credentials cannot be used on admin login endpoint
        admin_login_res = self.client.post("/api/admin/login", json={
            "email": self.test_cust_email,
            "password": self.test_cust_pwd
        })
        self.assertEqual(admin_login_res.status_code, 403)
        self.assertIn("Admin privileges are required", admin_login_res.json()["detail"])
        print("[PASS] Customer account strictly forbidden from all admin APIs and admin login (403 Forbidden).")

    def test_03_customer_can_browse_cars_and_view_own_bookings(self):
        """Verify customer can browse cars and query their own bookings list."""
        login_res = self.client.post("/api/auth/login", json={
            "email": self.test_cust_email,
            "password": self.test_cust_pwd
        })
        cust_token = login_res.json()["token"]
        cust_headers = {"Authorization": f"Bearer {cust_token}"}

        # 1. Browse cars
        cars_res = self.client.get("/api/cars")
        self.assertEqual(cars_res.status_code, 200)
        self.assertGreater(len(cars_res.json().get("cars", [])), 0)

        # 2. View my bookings
        my_bookings_res = self.client.get("/api/bookings/my", headers=cust_headers)
        self.assertEqual(my_bookings_res.status_code, 200)
        self.assertIsInstance(my_bookings_res.json().get("bookings"), list)
        print("[PASS] Customer can browse fleet and access private /api/bookings/my.")

    def test_04_admin_login_and_full_privileges(self):
        """Verify administrator login and access to admin management APIs."""
        # Find admin account in database
        admin_user = self.db.query(models.User).filter(models.User.role == "admin").first()
        self.assertIsNotNone(admin_user, "No admin user found in database!")

        # Verify admin login via /api/admin/login
        # Test with the known admin email
        from auth import verify_password
        admin_pwd = "AdminSecure2026!" if verify_password("AdminSecure2026!", admin_user.password_hash) else "admin123"

        admin_login_res = self.client.post("/api/admin/login", json={
            "email": admin_user.email,
            "password": admin_pwd
        })
        self.assertEqual(admin_login_res.status_code, 200)
        admin_data = admin_login_res.json()
        self.assertIn("token", admin_data)
        self.assertEqual(admin_data["user"]["role"], "admin")
        admin_token = admin_data["token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # Verify access to admin endpoints
        stats_res = self.client.get("/api/admin/stats", headers=admin_headers)
        self.assertEqual(stats_res.status_code, 200)

        bookings_res = self.client.get("/api/admin/bookings", headers=admin_headers)
        self.assertEqual(bookings_res.status_code, 200)

        customers_res = self.client.get("/api/admin/customers", headers=admin_headers)
        self.assertEqual(customers_res.status_code, 200)
        print("[PASS] Admin login succeeded with full management access to stats, bookings, and customers.")

    def test_05_invalid_credentials_rejected(self):
        """Verify invalid passwords and nonexistent emails are rejected with 401."""
        res_bad_pwd = self.client.post("/api/auth/login", json={
            "email": self.test_cust_email,
            "password": "CompletelyWrongPassword!"
        })
        self.assertEqual(res_bad_pwd.status_code, 401)
        self.assertEqual(res_bad_pwd.json()["detail"], "Invalid email or password.")

        res_bad_email = self.client.post("/api/auth/login", json={
            "email": "nonexistent_user_xyz@example.com",
            "password": "Password123!"
        })
        self.assertEqual(res_bad_email.status_code, 401)

        res_bad_admin = self.client.post("/api/admin/login", json={
            "email": "nonexistent_admin@example.com",
            "password": "Password123!"
        })
        self.assertEqual(res_bad_admin.status_code, 401)
        self.assertEqual(res_bad_admin.json()["detail"], "Invalid administrator email or password.")
        print("[PASS] Invalid passwords and nonexistent accounts strictly rejected with 401 Unauthorized.")

if __name__ == "__main__":
    unittest.main()

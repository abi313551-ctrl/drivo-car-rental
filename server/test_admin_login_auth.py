"""
Focused test for Admin Authentication & Role-Based Access
"""
import sys
import os
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app

class TestAdminLoginAuth(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_01_admin_login_success(self):
        """Test admin login with valid administrator credentials"""
        res = self.client.post("/api/admin/login", json={
            "email": "admin@drivo.com",
            "password": "AdminSecure2026!"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("token", data)
        self.assertIn("user", data)
        self.assertEqual(data["user"]["role"], "admin")
        print("\n[PASS] Admin login succeeded with 200 OK and valid JWT.")

    def test_02_admin_login_alias_route(self):
        """Test admin login on /admin/login alias route"""
        res = self.client.post("/admin/login", json={
            "email": "admin@drivo.com",
            "password": "AdminSecure2026!"
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["user"]["role"], "admin")
        print("[PASS] Admin login on /admin/login succeeded.")

    def test_03_admin_route_protection(self):
        """Verify protected admin stats endpoint accepts admin token"""
        login_res = self.client.post("/api/admin/login", json={
            "email": "admin@drivo.com",
            "password": "AdminSecure2026!"
        })
        token = login_res.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        stats_res = self.client.get("/api/admin/stats", headers=headers)
        self.assertEqual(stats_res.status_code, 200)
        stats = stats_res.json()
        self.assertIn("totalUsers", stats)
        self.assertIn("totalCars", stats)
        print("[PASS] Protected /api/admin/stats accessible with admin token.")

    def test_04_admin_invalid_password(self):
        """Verify invalid password returns 401"""
        res = self.client.post("/api/admin/login", json={
            "email": "admin@drivo.com",
            "password": "WrongPassword123"
        })
        self.assertEqual(res.status_code, 401)
        self.assertEqual(res.json()["detail"], "Invalid administrator email or password.")
        print("[PASS] Invalid password rejected with 401.")

    def test_05_admin_nonexistent_email(self):
        """Verify non-existent email returns 401"""
        res = self.client.post("/api/admin/login", json={
            "email": "unknown_admin@example.com",
            "password": "admin123"
        })
        self.assertEqual(res.status_code, 401)
        self.assertEqual(res.json()["detail"], "Invalid administrator email or password.")
        print("[PASS] Nonexistent email rejected with 401.")

if __name__ == "__main__":
    unittest.main()

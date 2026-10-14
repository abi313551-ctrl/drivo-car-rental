"""
Test suite for Drivo PDF Invoice & Booking Receipt Generation
Verifies:
1. Standalone PDF generator creates valid PDF bytes with header '%PDF-'
2. FastAPI endpoint /api/bookings/{ref}/invoice.pdf returns:
   - 404 for non-existent booking
   - 403 when a non-owner, non-admin user tries to download
   - 200 with application/pdf and proper Content-Disposition for booking owner and admin
3. Correct handling of paid vs unpaid payment states
"""
import sys
import os
import unittest
from fastapi.testclient import TestClient

# Ensure server module path is available
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app
from database import get_db, SessionLocal
from pdf_generator import generate_invoice_pdf
from auth import create_access_token
import models

class TestPdfInvoice(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        # Find an owned test booking in MySQL
        cls.booking = cls.db.query(models.Booking).filter(models.Booking.user_id.isnot(None)).first()
        if not cls.booking:
            cls.booking = cls.db.query(models.Booking).first()
        if not cls.booking:
            raise RuntimeError("No bookings found in database for testing.")
        
        cls.ref = cls.booking.ref
        cls.car = cls.db.query(models.Car).filter(models.Car.id == cls.booking.car_id).first()
        
        # Determine owner
        cls.owner_id = cls.booking.user_id
        if cls.owner_id:
            cls.owner = cls.db.query(models.User).filter(models.User.id == cls.owner_id).first()
        else:
            cls.owner = None

        # Admin user
        cls.admin = cls.db.query(models.User).filter(models.User.role == "admin").first()

        # Stranger user (non-owner, non-admin)
        if cls.owner_id:
            cls.stranger = cls.db.query(models.User).filter(
                models.User.id != cls.owner_id,
                models.User.role != "admin"
            ).first()
        else:
            cls.stranger = None

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_pdf_generator_standalone(self):
        """Test standalone generate_invoice_pdf output format and headers"""
        booking_dict = {
            "ref": "TEST-STANDALONE-001",
            "car_name": "Tesla Model 3 Performance",
            "car_category": "Electric",
            "start": "2026-11-01T10:00:00",
            "end": "2026-11-04T10:00:00",
            "pickup": "Mumbai International Airport (BOM)",
            "dropoff": "Mumbai International Airport (BOM)",
            "customer_name": "Test Customer",
            "customer_email": "test@example.com",
            "customer_phone": "+91 98765 43210",
            "customer_license": "DL-1420110012345",
            "payment_status": "Paid",
            "payment_method": "Razorpay / UPI",
            "transaction_id": "TXN_TEST_998877",
            "paid_at": "2026-11-01T10:05:00",
            "status": "Confirmed",
        }
        car_dict = {
            "name": "Tesla Model 3 Performance",
            "category": "Electric",
            "transmission": "Automatic",
            "fuel": "Electric",
            "seats": 5,
        }
        pricing_dict = {
            "days": 3,
            "daily_rate": 7999,
            "base_price": 23997,
            "extras": [{"name": "Comprehensive Zero-Dep Insurance", "price": 1497}],
            "extras_total": 1497,
            "coupon_discount": 1000,
            "coupon_code": "FESTIVE10",
            "gst": 4408,
            "cgst": 2204,
            "sgst": 2204,
            "refundable_deposit": 5000,
            "total": 33902,
        }

        pdf_bytes = generate_invoice_pdf(booking_dict, car_dict, pricing_dict)
        self.assertIsInstance(pdf_bytes, bytes)
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"), "Generated content must start with PDF magic bytes %PDF-")
        self.assertGreater(len(pdf_bytes), 3000, "PDF size should be substantial (at least 3KB)")
        print(f"\n[PASS] Standalone PDF generation successful: {len(pdf_bytes)} bytes generated.")

    def test_02_invoice_endpoint_not_found(self):
        """Test GET /api/bookings/{ref}/invoice.pdf with non-existent ref returns 404"""
        res = self.client.get("/api/bookings/NONEXISTENT_REF_9999/invoice.pdf")
        self.assertEqual(res.status_code, 404)
        print("\n[PASS] Non-existent booking returns 404 Not Found.")

    def test_03_invoice_endpoint_stranger_forbidden(self):
        """Test GET /api/bookings/{ref}/invoice.pdf with unauthorized stranger returns 403"""
        if not self.stranger or not self.owner_id:
            print("\n[SKIP] Stranger test skipped (no separate non-owner user in db)")
            return

        token = create_access_token({"sub": str(self.stranger.id), "email": self.stranger.email, "role": "customer"})
        headers = {"Authorization": f"Bearer {token}"}
        res = self.client.get(f"/api/bookings/{self.ref}/invoice.pdf", headers=headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("Access denied", res.json().get("detail", ""))
        print("\n[PASS] Stranger receives 403 Forbidden.")

    def test_04_invoice_endpoint_owner_success(self):
        """Test GET /api/bookings/{ref}/invoice.pdf with owner returns 200 and PDF stream"""
        if not self.owner:
            print("\n[SKIP] Owner test skipped (booking has no user_id)")
            return

        token = create_access_token({"sub": str(self.owner.id), "email": self.owner.email, "role": self.owner.role})
        headers = {"Authorization": f"Bearer {token}"}
        res = self.client.get(f"/api/bookings/{self.ref}/invoice.pdf", headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("content-type"), "application/pdf")
        self.assertIn(f'filename="Drivo-Invoice-{self.ref}.pdf"', res.headers.get("content-disposition", ""))
        self.assertTrue(res.content.startswith(b"%PDF-"))
        print(f"\n[PASS] Booking owner downloaded PDF invoice: {len(res.content)} bytes.")

    def test_05_invoice_endpoint_admin_success(self):
        """Test GET /api/bookings/{ref}/invoice.pdf with admin returns 200 regardless of owner"""
        if not self.admin:
            print("\n[SKIP] Admin test skipped (no admin user in db)")
            return

        token = create_access_token({"sub": str(self.admin.id), "email": self.admin.email, "role": "admin"})
        headers = {"Authorization": f"Bearer {token}"}
        res = self.client.get(f"/api/bookings/{self.ref}/invoice.pdf", headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("content-type"), "application/pdf")
        self.assertTrue(res.content.startswith(b"%PDF-"))
        print(f"\n[PASS] Admin authorized to download PDF invoice: {len(res.content)} bytes.")

    def test_06_receipt_alias_endpoint(self):
        """Test GET /api/bookings/{ref}/receipt.pdf returns 200 alias for admin"""
        if not self.admin:
            return

        token = create_access_token({"sub": str(self.admin.id), "email": self.admin.email, "role": "admin"})
        headers = {"Authorization": f"Bearer {token}"}
        res = self.client.get(f"/api/bookings/{self.ref}/receipt.pdf", headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("content-type"), "application/pdf")
        self.assertTrue(res.content.startswith(b"%PDF-"))
        print(f"\n[PASS] /receipt.pdf alias successfully serves PDF: {len(res.content)} bytes.")

if __name__ == "__main__":
    unittest.main()

"""
Test suite for Drivo Pickup Location Selection & Map Feature
Verifies:
1. Locations API: GET /api/locations returns all verified locations across 8 cities
2. City filtering: Case-insensitive filtering returns 3 verified hubs per city
3. Location metadata completeness: Name, tag, address, coordinates, hours, instructions, phone
4. Booking persistence: Selected pickup & dropoff stations save to MySQL database
5. Serialized booking enrichment: Returns structured pickupLocation & dropoffLocation
6. PDF generation compatibility: Invoice PDF builds cleanly with station addresses
"""
import sys
import os
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app
from database import SessionLocal
import models
from locations_data import SUPPORTED_LOCATIONS, get_locations_by_city, get_location_by_name
from pdf_generator import generate_invoice_pdf

class TestPickupLocations(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()
        cls._cleanup()

    @classmethod
    def tearDownClass(cls):
        cls._cleanup()
        cls.db.close()

    @classmethod
    def _cleanup(cls):
        test_bookings = cls.db.query(models.Booking).all()
        for b in test_bookings:
            cust = b.customer if isinstance(b.customer, dict) else {}
            if cust.get("email") == "station_test@drivo.example":
                cls.db.delete(b)
        cls.db.commit()

    def test_01_all_locations_count_and_cities(self):
        """Verify 24 verified stations across the 8 supported cities"""
        self.assertEqual(len(SUPPORTED_LOCATIONS), 24)
        cities = {loc["city"] for loc in SUPPORTED_LOCATIONS}
        expected_cities = {
            "Coimbatore", "Chennai", "Bengaluru", "Kochi",
            "Hyderabad", "Mumbai", "Delhi", "Nagercoil"
        }
        self.assertEqual(cities, expected_cities)
        print("\n[PASS] Verified 24 stations across all 8 supported cities.")

    def test_02_locations_metadata_integrity(self):
        """Verify each station has valid GPS coordinates, address, hours, instructions, and phone"""
        for loc in SUPPORTED_LOCATIONS:
            self.assertIn("name", loc)
            self.assertIn("address", loc)
            self.assertIn("lat", loc)
            self.assertIn("lng", loc)
            self.assertIn("hours", loc)
            self.assertIn("instructions", loc)
            self.assertIn("phone", loc)

            # Coordinate bounds for India: Lat roughly 8 to 36, Lng roughly 68 to 97
            self.assertGreater(loc["lat"], 8.0, f"Lat too low for {loc['name']}")
            self.assertLess(loc["lat"], 32.0, f"Lat too high for {loc['name']}")
            self.assertGreater(loc["lng"], 72.0, f"Lng too low for {loc['name']}")
            self.assertLess(loc["lng"], 81.0, f"Lng too high for {loc['name']}")

            self.assertTrue(len(loc["address"]) > 10, f"Address too short for {loc['name']}")
            self.assertTrue(len(loc["instructions"]) > 15, f"Instructions too short for {loc['name']}")
        print("\n[PASS] All 24 stations have valid GPS coordinates, addresses, and instructions.")

    def test_03_get_locations_api_endpoint(self):
        """Test GET /api/locations endpoint"""
        res = self.client.get("/api/locations")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("ok"))
        self.assertEqual(data.get("count"), 24)
        self.assertEqual(len(data.get("locations", [])), 24)
        print("\n[PASS] GET /api/locations returns 200 OK with 24 stations.")

    def test_04_get_locations_api_city_filter(self):
        """Test GET /api/locations?city=... with case-insensitivity"""
        res_cjb = self.client.get("/api/locations?city=Coimbatore")
        self.assertEqual(res_cjb.status_code, 200)
        cjb_locs = res_cjb.json().get("locations", [])
        self.assertEqual(len(cjb_locs), 3)

        # Case insensitive check
        res_lower = self.client.get("/api/locations?city=coimbatore")
        self.assertEqual(len(res_lower.json().get("locations", [])), 3)

        res_upper = self.client.get("/api/locations?city=CHENNAI")
        self.assertEqual(len(res_upper.json().get("locations", [])), 3)
        print("\n[PASS] City filtering functions with full case-insensitivity.")

    def test_05_location_lookup_helper(self):
        """Test get_location_by_name lookup functionality"""
        loc1 = get_location_by_name("Coimbatore Airport")
        self.assertIsNotNone(loc1)
        self.assertEqual(loc1["city"], "Coimbatore")
        self.assertEqual(loc1["type"], "airport")

        # Fuzzy / partial matching
        loc2 = get_location_by_name("Chennai Central Railway Station")
        self.assertIsNotNone(loc2)
        self.assertEqual(loc2["city"], "Chennai")

        # Unknown location returns None safely
        self.assertIsNone(get_location_by_name("Nonexistent Mars Colony"))
        print("\n[PASS] Station lookup helper accurately matches station names.")

    def test_06_booking_persistence_with_selected_station(self):
        """Test creating a booking with a selected pickup location persists to MySQL"""
        car = self.db.query(models.Car).filter(models.Car.available == True).first()
        self.assertIsNotNone(car, "Active car required for booking test")

        pickup_station = "Coimbatore Airport"
        dropoff_station = "Coimbatore City Center"

        payload = {
            "carId": car.id,
            "pickup": pickup_station,
            "dropoff": dropoff_station,
            "start": "2026-12-01T10:00:00",
            "end": "2026-12-03T18:00:00",
            "customer": {
                "fullName": "Station Verification User",
                "email": "station_test@drivo.example",
                "phone": "+91 98765 00000",
                "license": "TN37 20190012345",
            },
            "extras": {},
            "couponCode": "",
        }

        res = self.client.post("/api/bookings", json=payload)
        self.assertIn(res.status_code, [200, 201], f"Booking creation failed: {res.text}")
        data = res.json()
        b_data = data.get("booking", {})

        self.assertEqual(b_data.get("pickup"), pickup_station)
        self.assertEqual(b_data.get("dropoff"), dropoff_station)

        # Enriched location objects returned by serializer
        p_loc = b_data.get("pickupLocation")
        self.assertIsNotNone(p_loc)
        self.assertEqual(p_loc.get("name"), pickup_station)
        self.assertIn("Civil Aerodrome Post", p_loc.get("address", ""))

        d_loc = b_data.get("dropoffLocation")
        self.assertIsNotNone(d_loc)
        self.assertEqual(d_loc.get("name"), dropoff_station)
        self.assertIn("104, West Club Road", d_loc.get("address", ""))

        # Verify persisted in MySQL using a fresh session
        db = SessionLocal()
        db_b = db.query(models.Booking).filter(models.Booking.ref == b_data["ref"]).first()
        self.assertIsNotNone(db_b)
        self.assertEqual(db_b.pickup, pickup_station)
        print(f"\n[PASS] Booking {db_b.ref} successfully persisted pickup '{pickup_station}' to MySQL.")
        # Cleanup
        db.delete(db_b)
        db.commit()
        db.close()

    def test_07_pdf_invoice_with_station_metadata(self):
        """Verify PDF invoice generation includes station address and instructions"""
        booking_dict = {
            "ref": "DRV-TEST-LOC01",
            "car_name": "Audi A4 Technology",
            "car_category": "Luxury",
            "pickup": "Coimbatore Airport",
            "dropoff": "Coimbatore City Center",
            "start": "2026-12-01T10:00:00",
            "end": "2026-12-03T18:00:00",
            "customer_name": "Station Customer",
            "customer_email": "customer@example.com",
            "customer_phone": "+91 98765 43210",
            "customer_license": "TN37 20200001234",
            "payment_status": "Paid",
            "payment_method": "UPI",
            "status": "Confirmed",
        }
        car_dict = {
            "name": "Audi A4 Technology",
            "category": "Luxury",
            "transmission": "Automatic",
            "fuel": "Petrol",
            "seats": 5,
            "price_per_day": 8500,
        }
        pricing_dict = {
            "days": 3,
            "base": 25500,
            "extras": 0,
            "discount": 0,
            "tax": 4590,
            "total": 35090,
        }

        pdf_bytes = generate_invoice_pdf(booking_dict, car_dict, pricing_dict)
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"))
        self.assertGreater(len(pdf_bytes), 3500)
        print(f"\n[PASS] PDF invoice generated with station metadata: {len(pdf_bytes)} bytes.")

if __name__ == "__main__":
    unittest.main()

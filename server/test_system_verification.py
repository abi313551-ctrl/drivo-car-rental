import os
import sys
import json
import urllib.request
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from database import SessionLocal
from models import Car, User, Booking, Favorite

def test_mysql_and_api():
    print("=== 1. VERIFYING MYSQL DIRECT CONNECTION ===")
    db = SessionLocal()
    db_cars = db.query(Car).all()
    print(f"Direct MySQL Cars Total: {len(db_cars)}")
    db_cats = Counter(c.category for c in db_cars)
    for cat, cnt in sorted(db_cats.items()):
        status = "PASS (>=15)" if cnt >= 15 else "FAIL (<15)"
        print(f"  [MySQL] {cat}: {cnt} cars -> {status}")
    
    unique_db_names = len(set(f"{c.brand} {c.model}".strip().lower() for c in db_cars))
    print(f"Unique vehicle models in MySQL: {unique_db_names} / {len(db_cars)}")

    users_cnt = db.query(User).count()
    bookings_cnt = db.query(Booking).count()
    favs_cnt = db.query(Favorite).count()
    print(f"Database Integrity: Users={users_cnt}, Bookings={bookings_cnt}, Favorites={favs_cnt}")
    db.close()

    print("\n=== 2. VERIFYING LIVE FASTAPI /api/cars ENDPOINT ===")
    url = "http://127.0.0.1:8000/api/cars"
    req = urllib.request.Request(url, headers={"User-Agent": "VerificationBot/1.0"})
    with urllib.request.urlopen(req, timeout=5) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        data = json.loads(resp.read().decode("utf-8"))
    
    api_cars = data.get("cars", [])
    print(f"Live API Cars Total: {len(api_cars)}")
    api_cats = Counter(c["category"] for c in api_cars)
    for cat, cnt in sorted(api_cats.items()):
        status = "PASS (>=15)" if cnt >= 15 else "FAIL (<15)"
        print(f"  [API] {cat}: {cnt} cars -> {status}")
    
    unique_api_names = len(set(f"{c['brand']} {c['model']}".strip().lower() for c in api_cars))
    print(f"Unique vehicle models in API: {unique_api_names} / {len(api_cars)}")

if __name__ == '__main__':
    test_mysql_and_api()

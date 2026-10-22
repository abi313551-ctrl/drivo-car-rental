"""
Database Migration: Kanniyakumari District Service Area
1. Creates `supported_locations` table and seeds verified Kanniyakumari stations.
2. Updates cars fleet to be stationed across authentic Kanniyakumari District hubs.
3. Aligns historical bookings with valid Kanniyakumari stations.
"""

import sys
import io
from database import engine, SessionLocal, Base
from models import Car, Booking, SupportedLocation
from locations_data import SUPPORTED_LOCATIONS, SUPPORTED_LOCALITIES

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Balanced distribution across Kanniyakumari hubs
HUBS_DISTRIBUTION = [
    "Nagercoil",
    "Kanyakumari",
    "Marthandam",
    "Thuckalay",
    "Kuzhithurai",
    "Colachel",
    "Padmanabhapuram",
    "Karungal",
    "Kulasekharam"
]

def migrate():
    print("=" * 60)
    print("MIGRATING DRIVO TO KANNIYAKUMARI DISTRICT SERVICE AREA")
    print("=" * 60)

    # 1. Create table if not exists
    Base.metadata.create_all(bind=engine, tables=[SupportedLocation.__table__])
    print("[1/4] Created 'supported_locations' table if not present.")

    db = SessionLocal()
    try:
        # 2. Seed supported locations
        existing_loc_count = db.query(SupportedLocation).count()
        print(f"[2/4] Seeding verified Kanniyakumari stations (Existing: {existing_loc_count})...")
        for s in SUPPORTED_LOCATIONS:
            loc = db.query(SupportedLocation).filter(SupportedLocation.id == s["id"]).first()
            if not loc:
                loc = SupportedLocation(
                    id=s["id"],
                    name=s["name"],
                    district="Kanniyakumari",
                    locality=s["locality"],
                    type=s["type"],
                    tag=s.get("tag"),
                    address=s["address"],
                    lat=s["lat"],
                    lng=s["lng"],
                    hours=s["hours"],
                    phone=s["phone"],
                    instructions=s.get("instructions"),
                    landmark=s.get("landmark"),
                    is_active=True
                )
                db.add(loc)
            else:
                loc.name = s["name"]
                loc.district = "Kanniyakumari"
                loc.locality = s["locality"]
                loc.address = s["address"]
                loc.hours = s["hours"]
                loc.phone = s["phone"]
                loc.instructions = s.get("instructions")
                loc.landmark = s.get("landmark")
        db.commit()
        total_locs = db.query(SupportedLocation).count()
        print(f"      Total Kanniyakumari stations seeded: {total_locs}")

        # 3. Migrate cars to Kanniyakumari district hubs
        print("\n[3/4] Re-stationing fleet exclusively across Kanniyakumari District hubs...")
        cars = db.query(Car).all()
        updated_cars = 0
        for i, car in enumerate(cars):
            # Explicitly station Mercedes-Benz E-Class at Nagercoil central hub
            if "Mercedes" in (car.brand or "") and "E-Class" in (car.model or ""):
                car.location = "Nagercoil"
                if car.description:
                    for old in ["Mumbai", "Padmanabhapuram", "Marthandam"]:
                        car.description = car.description.replace(f"available from {old}", "available from Nagercoil Hub, Kanniyakumari District")
            # If car location is not already one of the valid Kanniyakumari localities
            elif car.location not in SUPPORTED_LOCALITIES:
                if any(b in (car.brand or "") for b in ["Mercedes", "BMW", "Audi", "Jaguar", "Porsche"]):
                    target_hub = "Nagercoil"
                else:
                    target_hub = HUBS_DISTRIBUTION[i % len(HUBS_DISTRIBUTION)]
                old_loc = car.location
                car.location = target_hub
                if car.description:
                    car.description = car.description.replace(f"available from {old_loc}", f"available from {target_hub} Hub, Kanniyakumari District")
                updated_cars += 1
            else:
                if car.description and "Kanniyakumari" not in car.description:
                    car.description = car.description.replace(f"available from {car.location}", f"available from {car.location} Hub, Kanniyakumari District")

        db.commit()
        print(f"      Re-stationed {updated_cars} cars into Kanniyakumari District.")

        # Show distribution summary
        from sqlalchemy import func
        dist = db.query(Car.location, func.count(Car.id)).group_by(Car.location).all()
        print("      Current fleet distribution by Kanniyakumari Hub:")
        for loc, count in dist:
            print(f"       - {loc}: {count} vehicles")

        # 4. Migrate existing booking pickup/dropoff stations
        print("\n[4/4] Aligning historical booking pickup/dropoff points...")
        bookings = db.query(Booking).all()
        updated_b = 0
        station_names = [s["name"] for s in SUPPORTED_LOCATIONS]
        for b in bookings:
            changed = False
            # Check if pickup is already a valid Kanniyakumari station/locality
            from locations_data import is_supported_kanniyakumari_location
            if not is_supported_kanniyakumari_location(b.pickup):
                b.pickup = "Nagercoil Junction Railway Station"
                changed = True
            if not is_supported_kanniyakumari_location(b.dropoff):
                b.dropoff = b.pickup
                changed = True
            if changed:
                updated_b += 1
        db.commit()
        print(f"      Updated {updated_b} historical bookings to valid Kanniyakumari stations.")

        print("\n" + "=" * 60)
        print("MIGRATION COMPLETED SUCCESSFULLY!")
        print("=" * 60)
    finally:
        db.close()

if __name__ == "__main__":
    migrate()

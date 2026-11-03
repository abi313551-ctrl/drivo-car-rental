from sqlalchemy.orm import Session
from models import Car, Coupon, User
from auth import hash_password

U = lambda pid: f"https://images.unsplash.com/photo-{pid}?auto=format&fit=crop&w=1000&q=70"

POOL = {
    "Hatchback": ["1552519507-da3b142c6e3d", "1502877338535-766e1452684a", "1549317661-bd32c8ce0db2"],
    "Sedan": ["1503376780353-7e6692767b70", "1494976388531-d1058494cdd8", "1511919884226-fd3cad34687c"],
    "SUV": ["1533473359331-0135ef1b58bf", "1519641471654-76ce0107ad1b", "1506015391300-4802dc74de2e"],
    "Electric": ["1560958089-b8a1929cea89", "1593941707882-a5bba14938c7", "1617788138017-80ad40651399"],
    "Luxury": ["1555215695-3004980ad54e", "1618843479313-40f8afb4b4d8", "1503736334956-4c8f8e92946d"],
}

BASE_FEATURES = [
    "Air conditioning",
    "Bluetooth audio",
    "Power windows",
    "Dual airbags",
    "ABS with EBD",
    "Reverse parking sensors",
]

EXTRA_FEATURES = {
    "Hatchback": ["Fuel-efficient engine", "Compact city size"],
    "Sedan": ["Spacious rear seat", "Cruise control"],
    "SUV": ["High ground clearance", "Large boot space"],
    "Electric": ["Zero tailpipe emissions", "Fast-charging support", "Regenerative braking"],
    "Luxury": ["Leather seats", "Panoramic sunroof", "Premium sound system", "Ambient lighting"],
}

DEPOSITS = {"Hatchback": 3000, "Sedan": 5000, "SUV": 8000, "Electric": 8000, "Luxury": 25000}


def _make_car(cid, brand, model, year, category, fuel, transmission, seats, price_per_day, rating, location, popularity):
    imgs = [U(POOL[category][(cid + i) % 3]) for i in range(3)]
    return Car(
        id=cid,
        brand=brand,
        model=model,
        year=year,
        category=category,
        fuel=fuel,
        transmission=transmission,
        seats=seats,
        price_per_day=price_per_day,
        rating=rating,
        location=location,
        popularity=popularity,
        image=imgs[0],
        images=imgs,
        deposit=DEPOSITS[category],
        available=True,
        features=BASE_FEATURES + EXTRA_FEATURES[category],
        description=(
            f"The {year} {brand} {model} is a {fuel.lower()} {category.lower()} with "
            f"{transmission.lower()} transmission and room for {seats}. It is cleaned and "
            f"inspected before every pickup and available from {location}."
        ),
    )


def seed_initial_data(db: Session):
    if db.query(Car).count() < 100:
        try:
            from build_100_cars_fleet import build_data
            all_cars_data = build_data()
            existing_ids = {c.id for c in db.query(Car.id).all()}
            new_cars = []
            for cd in all_cars_data:
                if cd["id"] not in existing_ids:
                    new_cars.append(
                        Car(
                            id=cd["id"],
                            brand=cd["brand"],
                            model=cd["model"],
                            registration_number=cd["registrationNumber"],
                            year=cd["year"],
                            category=cd["category"],
                            fuel=cd["fuel"],
                            transmission=cd["transmission"],
                            seats=cd["seats"],
                            price_per_day=cd["pricePerDay"],
                            rating=cd["rating"],
                            location=cd["location"],
                            popularity=cd["popularity"],
                            image=cd["image"],
                            images=cd["images"],
                            deposit=cd["deposit"],
                            available=cd["available"],
                            features=cd["features"],
                            description=cd["description"],
                        )
                    )
            if new_cars:
                db.add_all(new_cars)
                db.commit()
                print(f"[SEED] Seeded {len(new_cars)} cars into database. Total: {db.query(Car).count()}")
        except Exception as err:
            print(f"[SEED ERROR] Could not seed 100+ cars: {err}")
            db.rollback()

    if db.query(Coupon).count() == 0:
        coupons = [
            Coupon(code="WELCOME10", type="percent", value=10, active=True, weekend_only=False, category=None, description="10% off the rental"),
            Coupon(code="WEEKEND15", type="percent", value=15, active=True, weekend_only=True, category=None, description="15% off for Friday or Saturday pickups"),
            Coupon(code="EVGO500", type="flat", value=500, active=True, weekend_only=False, category="Electric", description="₹500 off electric cars"),
        ]
        db.add_all(coupons)
        db.commit()

    if db.query(User).count() == 0:
        admin_email = os.getenv("ADMIN_EMAIL")
        admin_password = os.getenv("ADMIN_PASSWORD")
        demo_users = []
        if admin_email and admin_password:
            demo_users.append(
                User(
                    full_name=os.getenv("ADMIN_NAME", "Drivo Administrator"),
                    email=admin_email.strip().lower(),
                    phone="9876543210",
                    license_number="TN3720180012345",
                    password_hash=hash_password(admin_password),
                    role="admin",
                )
            )
        if demo_users:
            db.add_all(demo_users)
            db.commit()

    try:
        from models import DecorationPackage
        if db.query(DecorationPackage).count() == 0:
            from seed_wedding_decor import seed_packages
            seed_packages()
    except Exception as e:
        print(f"Decoration package seed notice: {e}")

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
    if db.query(Car).count() == 0:
        cars = [
            _make_car(1, "Maruti Suzuki", "Swift", 2024, "Hatchback", "Petrol", "Manual", 5, 1500, 4.5, "Coimbatore", 95),
            _make_car(2, "Hyundai", "i20", 2023, "Hatchback", "Petrol", "Manual", 5, 1700, 4.4, "Chennai", 80),
            _make_car(3, "Tata", "Altroz", 2024, "Hatchback", "Diesel", "Manual", 5, 1600, 4.3, "Bengaluru", 62),
            _make_car(4, "Honda", "City", 2023, "Sedan", "Petrol", "Automatic", 5, 2500, 4.6, "Chennai", 90),
            _make_car(5, "Hyundai", "Verna", 2024, "Sedan", "Petrol", "Automatic", 5, 2600, 4.5, "Hyderabad", 70),
            _make_car(6, "Skoda", "Slavia", 2023, "Sedan", "Petrol", "Manual", 5, 2400, 4.4, "Kochi", 55),
            _make_car(7, "Hyundai", "Creta", 2024, "SUV", "Diesel", "Automatic", 5, 3200, 4.7, "Bengaluru", 98),
            _make_car(8, "Mahindra", "XUV700", 2024, "SUV", "Diesel", "Automatic", 7, 4000, 4.7, "Hyderabad", 85),
            _make_car(9, "Toyota", "Innova Crysta", 2023, "SUV", "Diesel", "Manual", 7, 4200, 4.8, "Coimbatore", 100),
            _make_car(10, "Mahindra", "Thar", 2023, "SUV", "Diesel", "Manual", 4, 3500, 4.6, "Delhi", 88),
            _make_car(11, "Tata", "Nexon EV", 2024, "Electric", "Electric", "Automatic", 5, 3000, 4.4, "Kochi", 66),
            _make_car(12, "MG", "ZS EV", 2024, "Electric", "Electric", "Automatic", 5, 3400, 4.5, "Delhi", 60),
            _make_car(13, "BMW", "5 Series", 2024, "Luxury", "Petrol", "Automatic", 5, 9500, 4.9, "Mumbai", 75),
            _make_car(14, "Mercedes-Benz", "E-Class", 2023, "Luxury", "Petrol", "Automatic", 5, 11000, 4.8, "Mumbai", 72),
        ]
        db.add_all(cars)
        db.commit()

    if db.query(Coupon).count() == 0:
        coupons = [
            Coupon(code="WELCOME10", type="percent", value=10, active=True, weekend_only=False, category=None, description="10% off the rental"),
            Coupon(code="WEEKEND15", type="percent", value=15, active=True, weekend_only=True, category=None, description="15% off for Friday or Saturday pickups"),
            Coupon(code="EVGO500", type="flat", value=500, active=True, weekend_only=False, category="Electric", description="₹500 off electric cars"),
        ]
        db.add_all(coupons)
        db.commit()

    if db.query(User).count() == 0:
        demo_users = [
            User(
                full_name="Drivo Admin",
                email="admin@drivo.example",
                phone="9876543210",
                license_number="TN3720180012345",
                password_hash=hash_password("admin123"),
                role="admin",
            ),
            User(
                full_name="Priya Raman",
                email="priya@drivo.example",
                phone="9876501234",
                license_number="TN3720190012345",
                password_hash=hash_password("customer123"),
                role="customer",
            ),
        ]
        db.add_all(demo_users)
        db.commit()

import random
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import Base, engine, SessionLocal, get_db
from models import User, Car, Favorite, Coupon, Booking, ContactMessage
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_optional_user,
    get_admin_user,
)
from schemas import (
    RegisterRequest,
    LoginRequest,
    ProfileUpdateRequest,
    BookingCreateRequest,
    PaymentUpdateRequest,
    CarCreateUpdateRequest,
    ContactCreateRequest,
    parse_iso_dt,
    validate_date_range,
    calculate_server_pricing,
)
from seed import seed_initial_data, BASE_FEATURES, EXTRA_FEATURES

app = FastAPI(title="Drivo Car Rental API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ACTIVE_STATUSES = {"Pending", "Confirmed"}
CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()


def serialize_user(u: User) -> dict:
    return {
        "id": u.id,
        "fullName": u.full_name,
        "email": u.email,
        "phone": u.phone or "",
        "license": u.license_number or "",
        "role": u.role,
        "createdAt": u.created_at.isoformat() if u.created_at else None,
    }


def serialize_car(c: Car) -> dict:
    return {
        "id": c.id,
        "brand": c.brand,
        "model": c.model,
        "year": c.year,
        "category": c.category,
        "fuel": c.fuel,
        "transmission": c.transmission,
        "seats": c.seats,
        "pricePerDay": c.price_per_day,
        "rating": c.rating,
        "location": c.location,
        "popularity": c.popularity,
        "image": c.image,
        "images": c.images or [c.image],
        "deposit": c.deposit,
        "available": c.available,
        "features": c.features or [],
        "description": c.description,
    }


def serialize_booking(b: Booking) -> dict:
    car = b.car
    car_snapshot = {
        "id": b.car_id,
        "brand": car.brand if car else "Car",
        "model": car.model if car else "",
        "year": car.year if car else 2024,
        "image": car.image if car else "",
        "category": car.category if car else "",
        "pricePerDay": car.price_per_day if car else 0,
        "location": car.location if car else "",
    }
    return {
        "id": b.id,
        "ref": b.ref,
        "userId": b.user_id,
        "carId": b.car_id,
        "car": car_snapshot,
        "pickup": b.pickup,
        "dropoff": b.dropoff,
        "start": b.start_time,
        "end": b.end_time,
        "customer": b.customer,
        "extras": b.extras,
        "pricing": b.pricing,
        "status": b.status,
        "paymentStatus": b.payment_status,
        "paymentMethod": b.payment_method,
        "createdAt": b.created_at.isoformat() if b.created_at else None,
        "cancelledAt": b.cancelled_at.isoformat() if b.cancelled_at else None,
    }


def find_car_conflict(db: Session, car_id: int, start_str: str, end_str: str, ignore_ref: Optional[str] = None) -> Optional[Booking]:
    s_dt = parse_iso_dt(start_str)
    e_dt = parse_iso_dt(end_str)
    bookings = db.query(Booking).filter(Booking.car_id == car_id, Booking.status.in_(ACTIVE_STATUSES)).all()
    for b in bookings:
        if ignore_ref and b.ref == ignore_ref:
            continue
        try:
            bs = parse_iso_dt(b.start_time)
            be = parse_iso_dt(b.end_time)
            if s_dt < be and bs < e_dt:
                return b
        except Exception:
            continue
    return None


def generate_booking_ref(db: Session) -> str:
    now = datetime.utcnow()
    d = f"{str(now.year)[2:]}{now.month:02d}{now.day:02d}"
    while True:
        suffix = "".join(random.choice(CHARS) for _ in range(5))
        ref = f"DRV-{d}-{suffix}"
        if not db.query(Booking).filter(Booking.ref == ref).first():
            return ref


# --- Health ---
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Drivo FastAPI Backend"}


# --- Auth & Users ---
@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    user = User(
        full_name=payload.fullName.strip(),
        email=email,
        phone=(payload.phone or "").strip(),
        license_number=(payload.license or "").strip().upper(),
        password_hash=hash_password(payload.password),
        role="customer",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"token": token, "user": serialize_user(user)}


@app.post("/api/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"token": token, "user": serialize_user(user)}


@app.get("/api/auth/me")
def get_me(user: User = Depends(get_current_user)):
    return {"user": serialize_user(user)}


@app.put("/api/auth/me")
def update_me(payload: ProfileUpdateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.full_name = payload.fullName.strip()
    user.phone = (payload.phone or "").strip()
    user.license_number = (payload.license or "").strip().upper()
    db.commit()
    db.refresh(user)
    return {"user": serialize_user(user)}


# --- Cars ---
@app.get("/api/cars")
def list_cars(db: Session = Depends(get_db)):
    cars = db.query(Car).order_by(Car.id.asc()).all()
    return {"cars": [serialize_car(c) for c in cars]}


@app.get("/api/cars/{car_id}")
def get_car(car_id: int, db: Session = Depends(get_db)):
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found.")
    return {"car": serialize_car(car)}


@app.get("/api/cars/{car_id}/availability")
def check_car_availability(
    car_id: int,
    start: str = Query(...),
    end: str = Query(...),
    db: Session = Depends(get_db),
):
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found.")
    if not car.available:
        return {"available": False, "reason": "Car is currently marked unavailable."}
    try:
        validate_date_range(start, end, check_past=False)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    conflict = find_car_conflict(db, car_id, start, end)
    if conflict:
        return {
            "available": False,
            "conflict": {"start": conflict.start_time, "end": conflict.end_time, "ref": conflict.ref},
        }
    return {"available": True, "conflict": None}


@app.post("/api/cars", status_code=status.HTTP_201_CREATED)
def create_car(payload: CarCreateUpdateRequest, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    imgs = payload.images if payload.images else [payload.image]
    feats = payload.features if payload.features else BASE_FEATURES + EXTRA_FEATURES.get(payload.category, [])
    desc = payload.description or (
        f"The {payload.year} {payload.brand} {payload.model} is a {payload.fuel.lower()} "
        f"{payload.category.lower()} with {payload.transmission.lower()} transmission and room for {payload.seats}."
    )
    car = Car(
        brand=payload.brand.strip(),
        model=payload.model.strip(),
        year=payload.year,
        category=payload.category,
        fuel=payload.fuel,
        transmission=payload.transmission,
        seats=payload.seats,
        price_per_day=payload.pricePerDay,
        rating=4.6,
        location=payload.location,
        popularity=80,
        image=payload.image,
        images=imgs,
        deposit=payload.deposit,
        available=payload.available,
        features=feats,
        description=desc,
    )
    db.add(car)
    db.commit()
    db.refresh(car)
    return {"car": serialize_car(car)}


@app.patch("/api/cars/{car_id}/availability")
def toggle_car_availability(car_id: int, available: bool = Query(...), admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found.")
    car.available = available
    db.commit()
    db.refresh(car)
    return {"car": serialize_car(car)}


# --- Favorites ---
@app.get("/api/favorites")
def get_favorites(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    favs = db.query(Favorite).filter(Favorite.user_id == user.id).all()
    return {"favorites": [f.car_id for f in favs]}


@app.post("/api/favorites/{car_id}")
def toggle_favorite(car_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found.")
    existing = db.query(Favorite).filter(Favorite.user_id == user.id, Favorite.car_id == car_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        action = "removed"
    else:
        db.add(Favorite(user_id=user.id, car_id=car_id))
        db.commit()
        action = "added"
    favs = db.query(Favorite).filter(Favorite.user_id == user.id).all()
    return {"action": action, "favorites": [f.car_id for f in favs]}


@app.delete("/api/favorites")
def clear_favorites(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Favorite).filter(Favorite.user_id == user.id).delete()
    db.commit()
    return {"favorites": []}


# --- Coupons & Pricing ---
@app.get("/api/coupons")
def list_coupons(db: Session = Depends(get_db)):
    coupons = db.query(Coupon).all()
    return {
        "coupons": [
            {
                "code": c.code,
                "type": c.type,
                "value": c.value,
                "category": c.category,
                "weekendOnly": c.weekend_only,
                "active": c.active,
                "description": c.description,
            }
            for c in coupons
        ]
    }


# --- Bookings ---
@app.get("/api/bookings")
def list_bookings(user: Optional[User] = Depends(get_optional_user), db: Session = Depends(get_db)):
    # Returns all active booking time slots for conflict detection + full details for the current user or admin
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).all()
    return {"bookings": [serialize_booking(b) for b in bookings]}


@app.get("/api/bookings/{ref}")
def get_booking_by_ref(ref: str, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.ref == ref).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    return {"booking": serialize_booking(booking)}


@app.post("/api/bookings", status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreateRequest,
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    car = db.query(Car).filter(Car.id == payload.carId).first()
    if not car:
        raise HTTPException(status_code=404, detail="Selected car does not exist.")
    if not car.available:
        raise HTTPException(status_code=400, detail=f"{car.brand} {car.model} is currently unavailable.")

    try:
        validate_date_range(payload.start, payload.end)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    conflict = find_car_conflict(db, car.id, payload.start, payload.end)
    if conflict:
        raise HTTPException(
            status_code=409,
            detail=f"{car.brand} {car.model} is already booked from {conflict.start_time} to {conflict.end_time}.",
        )

    coupon_obj = None
    if payload.couponCode and payload.couponCode.strip():
        code = payload.couponCode.strip().upper()
        coupon_obj = db.query(Coupon).filter(Coupon.code == code).first()

    pricing = calculate_server_pricing(
        price_per_day=car.price_per_day,
        deposit=car.deposit,
        start_str=payload.start,
        end_str=payload.end,
        extras=payload.extras,
        coupon_obj=coupon_obj,
        car_category=car.category,
    )

    booking = Booking(
        ref=generate_booking_ref(db),
        user_id=user.id if user else None,
        car_id=car.id,
        pickup=payload.pickup.strip(),
        dropoff=payload.dropoff.strip(),
        start_time=payload.start,
        end_time=payload.end,
        customer={
            "fullName": payload.customer.fullName,
            "email": payload.customer.email.lower(),
            "phone": payload.customer.phone,
            "license": payload.customer.license,
        },
        extras=payload.extras,
        pricing=pricing,
        status="Confirmed",
        payment_status="Pending",
        payment_method=None,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return {"booking": serialize_booking(booking)}


@app.post("/api/bookings/{ref}/cancel")
def cancel_booking(ref: str, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.ref == ref).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.status not in ACTIVE_STATUSES:
        raise HTTPException(status_code=400, detail="Booking is already cancelled or completed.")

    try:
        start_dt = parse_iso_dt(booking.start_time)
        if (start_dt - datetime.now()).total_seconds() < 86400:
            raise HTTPException(status_code=400, detail="Only active bookings starting in 24+ hours can be cancelled.")
    except HTTPException:
        raise
    except Exception:
        pass

    booking.status = "Cancelled"
    booking.cancelled_at = datetime.utcnow()
    if booking.payment_status == "Paid":
        booking.payment_status = "Refunded"
    db.commit()
    db.refresh(booking)
    return {"booking": serialize_booking(booking)}


@app.post("/api/bookings/{ref}/payment")
def update_booking_payment(ref: str, payload: PaymentUpdateRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.ref == ref).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.status == "Cancelled":
        raise HTTPException(status_code=400, detail="Cannot pay for a cancelled booking.")

    booking.payment_method = payload.paymentMethod
    booking.payment_status = payload.paymentStatus
    db.commit()
    db.refresh(booking)
    return {"booking": serialize_booking(booking)}


# --- Contact Messages ---
@app.post("/api/contact", status_code=status.HTTP_201_CREATED)
def submit_contact(payload: ContactCreateRequest, db: Session = Depends(get_db)):
    msg = ContactMessage(
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        phone=(payload.phone or "").strip(),
        subject=payload.subject.strip(),
        message=payload.message.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"ok": True, "id": msg.id, "message": "Your message has been received. Our team will respond shortly."}


@app.get("/api/contact")
def list_contacts(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    msgs = db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()
    return {
        "messages": [
            {
                "id": m.id,
                "name": m.name,
                "email": m.email,
                "phone": m.phone,
                "subject": m.subject,
                "message": m.message,
                "createdAt": m.created_at.isoformat() if m.created_at else None,
            }
            for m in msgs
        ]
    }

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(25), nullable=True)
    license_number = Column(String(30), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="customer", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="user")


class Car(Base):
    __tablename__ = "cars"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String(60), nullable=False)
    model = Column(String(80), nullable=False)
    year = Column(Integer, nullable=False)
    category = Column(String(40), nullable=False, index=True)
    fuel = Column(String(30), nullable=False)
    transmission = Column(String(30), nullable=False)
    seats = Column(Integer, nullable=False)
    price_per_day = Column(Integer, nullable=False)
    rating = Column(Float, default=4.5, nullable=False)
    location = Column(String(60), nullable=False, index=True)
    popularity = Column(Integer, default=75, nullable=False)
    image = Column(String(500), nullable=False)
    images = Column(JSON, nullable=False)
    deposit = Column(Integer, default=5000, nullable=False)
    available = Column(Boolean, default=True, nullable=False)
    features = Column(JSON, nullable=False)
    description = Column(Text, nullable=False)

    bookings = relationship("Booking", back_populates="car")


class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint("user_id", "car_id", name="uq_user_car_fav"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="favorites")
    car = relationship("Car")


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True, index=True, nullable=False)
    type = Column(String(20), nullable=False)  # 'percent' | 'flat'
    value = Column(Integer, nullable=False)
    category = Column(String(40), nullable=True)
    weekend_only = Column(Boolean, default=False, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    description = Column(String(255), nullable=False)


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    ref = Column(String(32), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="RESTRICT"), nullable=False, index=True)
    pickup = Column(String(120), nullable=False)
    dropoff = Column(String(120), nullable=False)
    start_time = Column(String(32), nullable=False)
    end_time = Column(String(32), nullable=False)
    customer = Column(JSON, nullable=False)
    extras = Column(JSON, nullable=False)
    pricing = Column(JSON, nullable=False)
    status = Column(String(30), default="Confirmed", nullable=False)  # Confirmed, Cancelled, Completed
    payment_status = Column(String(30), default="Pending", nullable=False)  # Pending, Paid, Refunded, Failed
    payment_method = Column(String(40), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    cancelled_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="bookings")
    car = relationship("Car", back_populates="bookings")


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), nullable=False)
    phone = Column(String(30), nullable=True)
    subject = Column(String(160), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

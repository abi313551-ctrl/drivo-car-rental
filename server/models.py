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
    reward_points = Column(Integer, default=0, nullable=False)
    lifetime_points = Column(Integer, default=0, nullable=False)
    tier = Column(String(20), default="Silver", nullable=False)  # Silver, Gold, Platinum
    email_notifs_enabled = Column(Boolean, default=True, nullable=False)
    pickup_reminders_enabled = Column(Boolean, default=True, nullable=False)
    return_reminders_enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="user")
    reward_transactions = relationship("RewardTransaction", back_populates="user", cascade="all, delete-orphan", order_by="desc(RewardTransaction.created_at)")


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


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("booking_id", name="uq_booking_review"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1 to 5
    title = Column(String(120), nullable=True)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")
    car = relationship("Car")
    booking = relationship("Booking")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_ref = Column(String(32), nullable=True, index=True)
    link = Column(String(255), nullable=True)
    title = Column(String(140), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(40), default="info", nullable=False)  # 'booking', 'cancellation', 'system', 'reminder', 'rewards'
    read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_ref = Column(String(32), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_name = Column(String(100), nullable=False)
    customer_email = Column(String(120), nullable=False)
    phone = Column(String(30), nullable=True)
    category = Column(String(50), default="General", nullable=False)
    subject = Column(String(160), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(30), default="Open", nullable=False)  # Open, In Progress, Resolved, Closed
    admin_reply = Column(Text, nullable=True)
    replied_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User")


class VehicleInspection(Base):
    __tablename__ = "vehicle_inspections"
    __table_args__ = (UniqueConstraint("booking_id", "stage", name="uq_booking_inspection_stage"),)

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="RESTRICT"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_name = Column(String(100), nullable=False)
    customer_email = Column(String(120), nullable=False)
    inspector_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    inspector_name = Column(String(100), nullable=False)
    stage = Column(String(20), nullable=False)  # 'pickup' | 'return'
    fuel_level = Column(Integer, nullable=False)  # 0 to 100 percentage
    odometer = Column(Integer, nullable=False)  # in km
    scratches = Column(Text, nullable=True)
    dents = Column(Text, nullable=True)
    exterior_condition = Column(String(50), default="Good", nullable=False)
    interior_condition = Column(String(50), default="Clean", nullable=False)
    tires_condition = Column(String(50), default="Good", nullable=True)
    cleanliness = Column(String(50), default="Clean", nullable=True)
    photos = Column(JSON, nullable=False)  # list of URLs
    notes = Column(Text, nullable=True)
    customer_signed = Column(Boolean, default=True, nullable=False)
    inspection_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    booking = relationship("Booking")
    car = relationship("Car")
    customer = relationship("User", foreign_keys=[customer_id])
    inspector = relationship("User", foreign_keys=[inspector_id])


class LoyaltyConfig(Base):
    __tablename__ = "loyalty_config"

    id = Column(Integer, primary_key=True)
    points_per_100_inr = Column(Float, default=1.0, nullable=False)  # 1 point per ₹100 spend
    redemption_value_inr = Column(Float, default=1.0, nullable=False)  # 1 point = ₹1 discount
    min_points_to_redeem = Column(Integer, default=50, nullable=False)  # min points required to redeem
    max_discount_percent = Column(Integer, default=30, nullable=False)  # max 30% discount from points
    silver_threshold = Column(Integer, default=0, nullable=False)
    gold_threshold = Column(Integer, default=300, nullable=False)
    platinum_threshold = Column(Integer, default=1000, nullable=False)
    gold_multiplier = Column(Float, default=1.25, nullable=False)  # 25% bonus points for Gold
    platinum_multiplier = Column(Float, default=1.5, nullable=False)  # 50% bonus points for Platinum
    is_active = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class RewardTransaction(Base):
    __tablename__ = "reward_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    booking_ref = Column(String(32), nullable=True, index=True)
    transaction_type = Column(String(30), nullable=False)  # 'earned', 'redeemed', 'refunded', 'adjustment'
    points = Column(Integer, nullable=False)  # positive (credit) or negative (debit)
    balance_after = Column(Integer, nullable=False)
    description = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="reward_transactions")
    booking = relationship("Booking")


class BookingReminder(Base):
    __tablename__ = "booking_reminders"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_ref = Column(String(32), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    recipient_email = Column(String(120), nullable=False)
    recipient_name = Column(String(100), nullable=False)
    reminder_type = Column(String(40), nullable=False, index=True)  # 'booking_confirmation', 'pickup_reminder', 'return_reminder', 'booking_cancellation', 'status_update'
    channel = Column(String(20), default="email", nullable=False)  # 'email', 'in_app'
    scheduled_for = Column(DateTime, nullable=False, index=True)
    sent_at = Column(DateTime, nullable=True)
    status = Column(String(30), default="pending", nullable=False, index=True)  # 'pending', 'sent', 'failed', 'cancelled', 'simulated', 'skipped'
    retry_count = Column(Integer, default=0, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)
    error_details = Column(Text, nullable=True)
    subject = Column(String(200), nullable=False)
    message_body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    booking = relationship("Booking")
    user = relationship("User")


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=False)
    license_number = Column(String(50), nullable=False)
    experience_years = Column(Integer, default=5, nullable=False)
    rating = Column(Float, default=4.9, nullable=False)
    photo = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    city = Column(String(60), default="Nagercoil", nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class DriverPricingConfig(Base):
    __tablename__ = "driver_pricing_configs"

    id = Column(Integer, primary_key=True, index=True)
    base_driver_fee = Column(Integer, default=1000, nullable=False)
    included_hours = Column(Integer, default=8, nullable=False)
    included_km = Column(Integer, default=100, nullable=False)
    overtime_rate_per_hour = Column(Integer, default=200, nullable=False)
    extra_km_rate = Column(Integer, default=20, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class DecorationPackage(Base):
    __tablename__ = "decoration_packages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    theme = Column(String(60), nullable=True)  # red_roses, white_floral, pink_bridal, marigold, premium_floral, custom
    badge = Column(String(60), nullable=True)
    subtitle = Column(String(120), nullable=True)
    starting_price = Column(Integer, nullable=False)  # Configurable starting price in INR
    description = Column(Text, nullable=False)
    category = Column(String(50), default="Floral", nullable=False)
    image = Column(String(255), nullable=False)
    gallery = Column(JSON, nullable=True)  # List of additional photo URLs
    included_items = Column(JSON, nullable=False)  # List of included decoration items
    compatible_categories = Column(JSON, nullable=True)  # Categories: Sedan, SUV, Luxury, MUV / MPV, Hatchback
    duration = Column(String(50), default="2 - 3 Hours", nullable=False)
    service_areas = Column(String(200), default="Nagercoil, Kanyakumari & Surrounding Districts", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class WeddingDecorationBooking(Base):
    __tablename__ = "wedding_decoration_bookings"

    id = Column(Integer, primary_key=True, index=True)
    ref = Column(String(32), unique=True, index=True, nullable=False)  # e.g. WED-261014-ABCDE
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    package_id = Column(Integer, ForeignKey("decoration_packages.id", ondelete="RESTRICT"), nullable=False, index=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(30), nullable=False)
    customer_email = Column(String(120), nullable=False)
    event_type = Column(String(60), default="Wedding", nullable=False)  # Wedding / Muhurtham, Bride or groom pickup, Reception, Engagement, etc.
    event_date = Column(String(32), nullable=False, index=True)  # YYYY-MM-DD
    completion_time = Column(String(32), nullable=False)  # e.g. 06:30 AM
    venue_location = Column(String(255), nullable=False)  # Wedding hall / home address
    pickup_location = Column(String(255), nullable=True)  # Where car/driver starts
    destination = Column(String(255), nullable=True)  # Destination location
    service_city = Column(String(60), default="Nagercoil", nullable=False)
    drive_mode = Column(String(30), default="with_driver", nullable=False)  # with_driver, self_drive, decor_only
    expected_duration_hours = Column(Integer, default=8, nullable=True)
    expected_distance_km = Column(Integer, default=100, nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="SET NULL"), nullable=True, index=True)
    flower_colors = Column(String(120), nullable=True)
    decor_style = Column(String(100), nullable=True)
    special_notes = Column(Text, nullable=True)
    reference_image = Column(String(255), nullable=True)
    car_rental_included = Column(Boolean, default=False, nullable=False)
    pricing = Column(JSON, nullable=False)  # Authoritative itemized breakdown
    status = Column(String(30), default="Pending", nullable=False, index=True)  # Pending, Confirmed, In Progress, Completed, Cancelled
    payment_status = Column(String(30), default="Pending", nullable=False)  # Pending, Paid, Refunded
    payment_method = Column(String(40), nullable=True)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    package = relationship("DecorationPackage")
    car = relationship("Car")
    user = relationship("User")
    driver = relationship("Driver")



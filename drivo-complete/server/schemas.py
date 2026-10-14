import math
import re
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field, field_validator

GST_RATE = 0.18
DAY_MS = 24 * 60 * 60 * 1000

EXTRAS_RATES = {
    "additionalDriver": 300,
    "childSeat": 150,
    "gps": 200,
    "premiumInsurance": 500,
}


def parse_iso_dt(value: str) -> datetime:
    if not value or not isinstance(value, str):
        raise ValueError("Invalid date string")
    cleaned = value.strip().replace("Z", "")
    # Support YYYY-MM-DDTHH:MM or full ISO
    return datetime.fromisoformat(cleaned)


def validate_date_range(start_str: str, end_str: str, check_past: bool = True) -> tuple[datetime, datetime, int]:
    try:
        start_dt = parse_iso_dt(start_str)
    except Exception:
        raise ValueError("Enter a valid pickup date and time")

    try:
        end_dt = parse_iso_dt(end_str)
    except Exception:
        raise ValueError("Enter a valid return date and time")

    if end_dt <= start_dt:
        raise ValueError("Return date and time must be after pickup")

    diff_seconds = (end_dt - start_dt).total_seconds()
    days = math.ceil(diff_seconds / 86400)
    if days > 30:
        raise ValueError("Rentals can be at most 30 days")
    if days < 1:
        raise ValueError("Minimum rental duration is 1 day")

    return start_dt, end_dt, days


def calculate_server_pricing(
    price_per_day: int,
    deposit: int,
    start_str: str,
    end_str: str,
    extras: Dict[str, bool],
    coupon_obj: Any = None,
    car_category: str = "",
) -> dict:
    start_dt, _, days = validate_date_range(start_str, end_str, check_past=False)
    base = days * price_per_day
    extras_per_day = sum(rate for key, rate in EXTRAS_RATES.items() if extras.get(key))
    extras_total = extras_per_day * days

    discount = 0
    applied_code = None
    coupon_error = None

    if coupon_obj:
        if not coupon_obj.active:
            coupon_error = "This coupon is no longer active."
        elif coupon_obj.category and coupon_obj.category != car_category:
            coupon_error = f"This coupon works on {coupon_obj.category} cars only."
        elif coupon_obj.weekend_only and start_dt.weekday() not in (4, 5):  # Friday=4, Saturday=5 in Python
            coupon_error = "This coupon needs a Friday or Saturday pickup."
        else:
            if coupon_obj.type == "percent":
                discount = round((base * coupon_obj.value) / 100)
            else:
                discount = min(coupon_obj.value, base)
            applied_code = coupon_obj.code

    taxable = max(0, base + extras_total - discount)
    tax = round(taxable * GST_RATE)
    total = taxable + tax

    return {
        "days": days,
        "base": base,
        "extras": extras_total,
        "discount": discount,
        "tax": tax,
        "deposit": deposit,
        "total": total,
        "couponCode": applied_code,
        "couponError": coupon_error,
    }


class RegisterRequest(BaseModel):
    fullName: str = Field(..., min_length=3, max_length=80)
    email: EmailStr
    phone: Optional[str] = ""
    license: Optional[str] = ""
    password: str = Field(..., min_length=6, max_length=100)

    @field_validator("fullName")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[A-Za-z][A-Za-z .'\-]{2,79}$", v):
            raise ValueError("Full name must contain letters and be at least 3 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class ProfileUpdateRequest(BaseModel):
    fullName: str = Field(..., min_length=3, max_length=80)
    phone: Optional[str] = ""
    license: Optional[str] = ""


class CustomerSchema(BaseModel):
    fullName: str
    email: EmailStr
    phone: str
    license: str

    @field_validator("fullName")
    @classmethod
    def check_name(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[A-Za-z][A-Za-z .'\-]{2,59}$", v):
            raise ValueError("Use letters only, at least 3 characters")
        return v

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v: str) -> str:
        cleaned = re.sub(r"[\s\-]", "", v or "")
        if not re.match(r"^(\+91|91|0)?[6-9]\d{9}$", cleaned):
            raise ValueError("Enter a valid 10-digit Indian mobile number")
        return v.strip()

    @field_validator("license")
    @classmethod
    def check_license(cls, v: str) -> str:
        cleaned = re.sub(r"[\s\-]", "", v or "").upper()
        if not re.match(r"^[A-Z]{2}\d{2}(19|20)\d{2}\d{7}$", cleaned):
            raise ValueError("Use the format TN37 20190012345")
        return cleaned


class BookingCreateRequest(BaseModel):
    carId: int
    pickup: str = Field(..., min_length=2)
    dropoff: str = Field(..., min_length=2)
    start: str
    end: str
    couponCode: Optional[str] = ""
    customer: CustomerSchema
    extras: Dict[str, bool] = Field(default_factory=dict)


class PaymentUpdateRequest(BaseModel):
    paymentMethod: str = Field(..., min_length=2, max_length=40)
    paymentStatus: str = Field(default="Paid")


class CarCreateUpdateRequest(BaseModel):
    brand: str = Field(..., min_length=2, max_length=60)
    model: str = Field(..., min_length=1, max_length=80)
    year: int = Field(..., ge=2015, le=2027)
    category: str = Field(..., min_length=2, max_length=40)
    fuel: str = Field(..., min_length=2, max_length=30)
    transmission: str = Field(..., min_length=2, max_length=30)
    seats: int = Field(..., ge=2, le=12)
    pricePerDay: int = Field(..., ge=500, le=100000)
    deposit: int = Field(default=5000, ge=0, le=200000)
    location: str = Field(..., min_length=2, max_length=60)
    image: str = Field(..., min_length=5)
    images: Optional[List[str]] = None
    available: bool = True
    features: Optional[List[str]] = None
    description: Optional[str] = ""


class ContactCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = ""
    subject: str = Field(..., min_length=3, max_length=160)
    message: str = Field(..., min_length=10, max_length=2000)

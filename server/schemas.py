import math
import re
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

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
    if " " in cleaned and "T" not in cleaned:
        cleaned = cleaned.replace(" ", "T")
    if len(cleaned) == 10 and cleaned.count("-") == 2:
        cleaned = f"{cleaned}T00:00"
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

    if check_past and start_dt < datetime.utcnow() - timedelta(minutes=30):
        raise ValueError("Pickup date and time cannot be in the past")

    if end_dt <= start_dt:
        raise ValueError("Return date and time must be later than pickup date and time")

    diff_seconds = (end_dt - start_dt).total_seconds()
    days = max(1, math.ceil(diff_seconds / 86400))
    if days > 30:
        raise ValueError("Rentals can be at most 30 days")

    return start_dt, end_dt, days


def calculate_server_pricing(
    price_per_day: int,
    deposit: int,
    start_str: str,
    end_str: str,
    extras: Dict[str, bool],
    coupon_obj: Any = None,
    car_category: str = "",
    redeem_points: int = 0,
    point_value_inr: float = 1.0,
    max_point_discount_percent: int = 30,
    user_points_balance: int = 0,
) -> dict:
    start_dt, _, days = validate_date_range(start_str, end_str, check_past=False)
    # Ensure positive rates
    safe_price_per_day = max(0, int(price_per_day))
    safe_deposit = max(0, int(deposit))
    base = days * safe_price_per_day
    extras_per_day = sum(rate for key, rate in EXTRAS_RATES.items() if extras.get(key))
    extras_total = extras_per_day * days

    discount = 0
    applied_code = None
    coupon_error = None

    if coupon_obj:
        if not coupon_obj.active:
            coupon_error = "This coupon is no longer active."
        elif coupon_obj.category and coupon_obj.category != car_category and coupon_obj.category.lower() not in car_category.lower():
            coupon_error = f"This coupon works on {coupon_obj.category} cars only."
        elif coupon_obj.weekend_only and start_dt.weekday() not in (4, 5):  # Friday=4, Saturday=5 in Python
            coupon_error = "This coupon needs a Friday or Saturday pickup."
        else:
            if coupon_obj.type == "percent":
                discount = round((base * coupon_obj.value) / 100)
            else:
                discount = min(coupon_obj.value, base)
            # Guarantee discount never exceeds base and is never negative
            discount = max(0, min(discount, base))
            applied_code = coupon_obj.code

    # Points redemption calculation
    net_before_points = max(0, base + extras_total - discount)
    points_discount = 0
    points_redeemed = 0
    if redeem_points and redeem_points > 0 and user_points_balance > 0 and point_value_inr > 0:
        # Cap requested points to actual user balance
        eligible_pts = min(int(redeem_points), int(user_points_balance))
        raw_discount = round(eligible_pts * point_value_inr)
        # Cap discount to configured maximum percentage of subtotal
        max_discount_allowed = round(net_before_points * (max_point_discount_percent / 100))
        points_discount = max(0, min(raw_discount, max_discount_allowed, net_before_points))
        # Authoritatively calculate exact points consumed
        points_redeemed = min(eligible_pts, round(points_discount / point_value_inr))

    taxable = max(0, net_before_points - points_discount)
    tax = round(taxable * GST_RATE)
    total = max(0, taxable + tax)

    return {
        "days": days,
        "pricePerDay": safe_price_per_day,
        "base": base,
        "extras": extras_total,
        "discount": discount,
        "pointsDiscount": points_discount,
        "pointsRedeemed": points_redeemed,
        "tax": tax,
        "deposit": safe_deposit,
        "total": total,
        "taxable": taxable,
        "gstRate": GST_RATE,
        "couponCode": applied_code,
        "couponError": coupon_error,
    }


class PriceCalculateRequest(BaseModel):
    carId: int
    start: str
    end: str
    extras: Optional[Dict[str, bool]] = Field(default_factory=dict)
    couponCode: Optional[str] = ""
    redeemPoints: Optional[int] = Field(default=0, ge=0)


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

    @field_validator("fullName")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[A-Za-z][A-Za-z .'\-]{2,79}$", v):
            raise ValueError("Full name must contain letters and be at least 3 characters")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> str:
        if not v or not v.strip():
            return ""
        cleaned = re.sub(r"[\s\-]", "", v.strip())
        if not re.match(r"^(\+91|91|0)?[6-9]\d{9}$", cleaned):
            raise ValueError("Enter a valid 10-digit Indian mobile number")
        return v.strip()

    @field_validator("license")
    @classmethod
    def validate_license(cls, v: Optional[str]) -> str:
        if not v or not v.strip():
            return ""
        cleaned = re.sub(r"[\s\-]", "", v.strip()).upper()
        if not re.match(r"^[A-Z]{2}\d{2}(19|20)\d{2}\d{7}$", cleaned):
            raise ValueError("Driving license must follow standard format (e.g. TN37 20190012345)")
        return cleaned


class RegisterSendOtpRequest(BaseModel):
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


class RegisterVerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class ResendOtpRequest(BaseModel):
    email: EmailStr
    purpose: str = Field(default="register")  # register or forgot_password


class ForgotPasswordSendOtpRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResetRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    newPassword: str = Field(..., min_length=6, max_length=100)


class GoogleAuthRequest(BaseModel):
    idToken: Optional[str] = None
    credential: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    googleId: Optional[str] = None



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
    redeemPoints: Optional[int] = Field(default=0, ge=0)


class PaymentUpdateRequest(BaseModel):
    paymentMethod: str = Field(..., min_length=2, max_length=40)
    paymentStatus: str = Field(default="Paid")


class RazorpayCreateOrderRequest(BaseModel):
    bookingRef: str = Field(..., min_length=5, max_length=40)


class RazorpayVerifyPaymentRequest(BaseModel):
    bookingRef: str = Field(..., min_length=5, max_length=40)
    razorpayOrderId: str = Field(..., min_length=5, max_length=100)
    razorpayPaymentId: str = Field(..., min_length=5, max_length=100)
    razorpaySignature: str = Field(..., min_length=5, max_length=255)
    paymentMethod: Optional[str] = "Razorpay"


class RazorpayFailureRequest(BaseModel):
    bookingRef: str = Field(..., min_length=5, max_length=40)
    razorpayOrderId: Optional[str] = None
    errorCode: Optional[str] = None
    errorDescription: Optional[str] = None


class CarCreateUpdateRequest(BaseModel):
    name: Optional[str] = None
    carName: Optional[str] = None
    brand: str = Field(default="", max_length=60)
    model: str = Field(default="", max_length=80)
    registrationNumber: Optional[str] = Field(default="", max_length=40)
    year: int = Field(default=2025, ge=2015, le=2027)
    category: str = Field(default="SUV", min_length=2, max_length=40)
    fuel: str = Field(default="Petrol", min_length=2, max_length=30)
    transmission: str = Field(default="Automatic", min_length=2, max_length=30)
    seats: int = Field(default=5, ge=2, le=12)
    pricePerDay: int = Field(default=3000, ge=500, le=100000)
    deposit: int = Field(default=5000, ge=0, le=200000)
    location: str = Field(default="Nagercoil", min_length=2, max_length=60)
    image: str = Field(..., min_length=5)
    images: Optional[List[str]] = None
    available: bool = True
    features: Optional[List[str]] = None
    description: Optional[str] = ""

    @model_validator(mode="before")
    @classmethod
    def normalize_car_fields(cls, data):
        if isinstance(data, dict):
            car_name = data.get("name") or data.get("carName") or data.get("car_name")
            brand = data.get("brand")
            model = data.get("model")
            if (not brand or not model) and car_name:
                parts = str(car_name).strip().split(" ", 1)
                if not brand:
                    data["brand"] = parts[0]
                if not model:
                    data["model"] = parts[1] if len(parts) > 1 else parts[0]
            if not data.get("brand"):
                data["brand"] = "Drivo"
            if not data.get("model"):
                data["model"] = "Vehicle"
        return data


class ContactCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = ""
    subject: str = Field(..., min_length=3, max_length=160)
    message: str = Field(..., min_length=10, max_length=2000)


class CouponValidateRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=30)
    carId: int
    start: str
    end: str
    extras: Optional[Dict[str, bool]] = Field(default_factory=dict)


class BookingStatusUpdateRequest(BaseModel):
    status: str = Field(..., pattern=r"^(Confirmed|Completed|Cancelled)$")
    paymentStatus: Optional[str] = Field(default=None, pattern=r"^(Pending|Paid|Refunded|Failed)$")


class ReviewCreateRequest(BaseModel):
    bookingRef: str = Field(..., min_length=5, max_length=32)
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = Field(default="", max_length=120)
    comment: str = Field(..., min_length=5, max_length=1000)


class SupportTicketCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(default="", max_length=30)
    category: Optional[str] = Field(default="General", max_length=50)
    subject: str = Field(..., min_length=3, max_length=160)
    message: str = Field(..., min_length=10, max_length=3000)


class SupportTicketReplyRequest(BaseModel):
    reply: str = Field(..., min_length=3, max_length=3000)
    status: Optional[str] = Field(default="Resolved", pattern=r"^(Open|In Progress|Resolved|Closed)$")


class SupportTicketStatusUpdateRequest(BaseModel):
    status: str = Field(..., pattern=r"^(Open|In Progress|Resolved|Closed)$")


class VehicleInspectionCreateRequest(BaseModel):
    stage: str = Field(..., pattern=r"^(pickup|return)$")
    odometer: int = Field(..., ge=0, le=1000000)
    fuelLevel: int = Field(..., ge=0, le=100)
    exteriorCondition: Optional[str] = Field(default="Good", max_length=50)
    interiorCondition: Optional[str] = Field(default="Clean", max_length=50)
    tiresCondition: Optional[str] = Field(default="Good", max_length=50)
    cleanliness: Optional[str] = Field(default="Clean", max_length=50)
    scratches: Optional[str] = Field(default="", max_length=1000)
    dents: Optional[str] = Field(default="", max_length=1000)
    photos: List[str] = Field(default_factory=list)
    notes: Optional[str] = Field(default="", max_length=2000)
    customerSigned: Optional[bool] = True


class LoyaltyConfigUpdateRequest(BaseModel):
    pointsPer100Inr: float = Field(..., ge=0.0, le=50.0)
    redemptionValueInr: float = Field(..., ge=0.1, le=10.0)
    minPointsToRedeem: int = Field(..., ge=0, le=10000)
    maxDiscountPercent: int = Field(..., ge=1, le=100)
    silverThreshold: int = Field(..., ge=0)
    goldThreshold: int = Field(..., ge=0)
    platinumThreshold: int = Field(..., ge=0)
    goldMultiplier: float = Field(..., ge=1.0, le=5.0)
    platinumMultiplier: float = Field(..., ge=1.0, le=5.0)
    isActive: bool = True


class AdminPointsAdjustmentRequest(BaseModel):
    userId: int
    points: int = Field(..., ge=-100000, le=100000)
    reason: str = Field(..., min_length=3, max_length=255)


class NotificationPreferencesUpdateRequest(BaseModel):
    emailNotifsEnabled: bool = True
    pickupRemindersEnabled: bool = True
    returnRemindersEnabled: bool = True


class DecorationPackageCreateUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    startingPrice: Optional[int] = Field(default=None, ge=500, le=500000)
    description: Optional[str] = Field(default=None, min_length=5, max_length=2000)
    category: Optional[str] = Field(default="Floral", max_length=50)
    theme: Optional[str] = Field(default=None, max_length=60)
    badge: Optional[str] = Field(default=None, max_length=50)
    subtitle: Optional[str] = Field(default=None, max_length=100)
    image: Optional[str] = Field(default=None, min_length=5)
    gallery: Optional[List[str]] = Field(default_factory=list)
    includedItems: Optional[List[str]] = None
    compatibleCategories: Optional[List[str]] = None
    duration: Optional[str] = Field(default="2 - 3 Hours", max_length=50)
    serviceAreas: Optional[str] = Field(default="Nagercoil, Kanyakumari & Surrounding Districts", max_length=200)
    estimatedDuration: Optional[str] = Field(default=None, max_length=50)
    isActive: Optional[bool] = None
    sortOrder: Optional[int] = None


class WeddingDecorationBookingCreateRequest(BaseModel):
    packageId: int
    carId: Optional[int] = None
    customerName: str = Field(..., min_length=2, max_length=100)
    customerPhone: str = Field(..., min_length=7, max_length=20)
    customerEmail: EmailStr
    eventType: str = Field(..., min_length=2, max_length=60)
    eventDate: str = Field(..., min_length=8, max_length=32)
    completionTime: str = Field(..., min_length=2, max_length=32)
    venueLocation: str = Field(..., min_length=3, max_length=255)
    pickupLocation: Optional[str] = Field(default="", max_length=255)
    destination: Optional[str] = Field(default="", max_length=255)
    serviceCity: Optional[str] = Field(default="Nagercoil", max_length=60)
    driveMode: Optional[str] = Field(default="with_driver", pattern=r"^(with_driver|self_drive|decor_only)$")
    expectedDurationHours: Optional[int] = Field(default=8, ge=1, le=48)
    expectedDistanceKm: Optional[int] = Field(default=100, ge=10, le=1000)
    driverId: Optional[int] = None
    flowerColors: Optional[str] = Field(default="", max_length=120)
    decorStyle: Optional[str] = Field(default="", max_length=100)
    specialNotes: Optional[str] = Field(default="", max_length=2000)
    referenceImage: Optional[str] = Field(default="", max_length=255)
    additionalAddons: Optional[List[str]] = Field(default_factory=list)


class WeddingBookingStatusUpdateRequest(BaseModel):
    status: str = Field(..., pattern=r"^(Pending|Confirmed|In Progress|Completed|Cancelled)$")
    paymentStatus: Optional[str] = Field(default=None, pattern=r"^(Pending|Paid|Refunded)$")
    adminNotes: Optional[str] = Field(default="", max_length=1000)


class DriverCreateUpdateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=7, max_length=30)
    licenseNumber: str = Field(..., min_length=5, max_length=50)
    experienceYears: Optional[int] = Field(default=5, ge=0, le=50)
    rating: Optional[float] = Field(default=4.9, ge=1.0, le=5.0)
    photo: Optional[str] = None
    isActive: Optional[bool] = True
    city: Optional[str] = Field(default="Nagercoil", max_length=60)
    notes: Optional[str] = ""


class DriverPricingConfigUpdateRequest(BaseModel):
    baseDriverFee: int = Field(..., ge=0, le=50000)
    includedHours: int = Field(..., ge=1, le=24)
    includedKm: int = Field(..., ge=10, le=1000)
    overtimeRatePerHour: int = Field(..., ge=0, le=5000)
    extraKmRate: int = Field(..., ge=0, le=200)
    isActive: Optional[bool] = True


class DriverAssignRequest(BaseModel):
    driverId: Optional[int] = None



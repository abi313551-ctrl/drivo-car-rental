import os
import hmac
import hashlib
from typing import Optional, Dict, Any
import razorpay
from fastapi import HTTPException, status

def get_razorpay_key_id() -> str:
    return os.getenv("RAZORPAY_KEY_ID", "").strip()

def get_razorpay_key_secret() -> str:
    return os.getenv("RAZORPAY_KEY_SECRET", "").strip()

def is_razorpay_configured() -> bool:
    key_id = get_razorpay_key_id()
    key_secret = get_razorpay_key_secret()
    return bool(key_id and key_secret)

def get_payment_config() -> Dict[str, Any]:
    key_id = get_razorpay_key_id()
    return {
        "gateway": "Razorpay",
        "keyId": key_id if key_id else None,
        "isConfigured": is_razorpay_configured(),
        "currency": "INR",
        "mode": "test" if (key_id.startswith("rzp_test_") or not key_id) else "live"
    }

def create_gateway_order(amount_inr: int, booking_ref: str, customer_info: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Creates an official Razorpay order for the booking in INR.
    Razorpay amounts are in paise (1 INR = 100 paise).
    """
    if not is_razorpay_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Razorpay test credentials are not configured on the backend. "
                "Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env."
            )
        )

    key_id = get_razorpay_key_id()
    key_secret = get_razorpay_key_secret()

    client = razorpay.Client(auth=(key_id, key_secret))
    amount_paise = int(amount_inr * 100)

    notes = {
        "booking_ref": booking_ref,
        "customer_email": (customer_info or {}).get("email", ""),
        "customer_name": (customer_info or {}).get("fullName", ""),
    }

    try:
        order = client.order.create(data={
            "amount": amount_paise,
            "currency": "INR",
            "receipt": booking_ref[:40],
            "notes": notes,
            "payment_capture": 1
        })
        return order
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Razorpay order creation failed: {str(exc)}"
        )

def verify_gateway_signature(order_id: str, payment_id: str, signature: str, secret_override: Optional[str] = None) -> bool:
    """
    Verifies payment signature using official HMAC-SHA256 signature verification.
    Formula: HMAC_SHA256(order_id + '|' + payment_id, secret) == signature
    """
    secret = secret_override or get_razorpay_key_secret()
    if not secret:
        return False

    msg = f"{order_id}|{payment_id}".encode("utf-8")
    expected_signature = hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected_signature, signature)

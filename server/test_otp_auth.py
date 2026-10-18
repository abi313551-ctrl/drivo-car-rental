import os
import hashlib
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models import User, EmailOTP

client = TestClient(app)

def test_full_otp_and_auth_workflow():
    db = SessionLocal()
    test_email = "test_otp_user_99@example.com"
    
    try:
        # Cleanup any existing test user or OTPs
        db.query(EmailOTP).filter(EmailOTP.email == test_email).delete()
        db.query(User).filter(User.email == test_email).delete()
        db.commit()

        # 1. Send OTP for registration
        reg_payload = {
            "fullName": "Test OTP User",
            "email": test_email,
            "phone": "+91 98765 43210",
            "license": "TN74-2024-0001",
            "password": "SecurePassword123!"
        }
        res = client.post("/api/auth/register/send-otp", json=reg_payload)
        assert res.status_code == 200, f"send-otp failed: {res.text}"
        data = res.json()
        assert data["success"] is True
        assert data["cooldown"] == 60
        print("PASS: /api/auth/register/send-otp returned 200")

        # 2. Rate limiting check (cooldown before 60s)
        res_rate = client.post("/api/auth/register/send-otp", json=reg_payload)
        assert res_rate.status_code == 429, f"expected 429 cooldown, got: {res_rate.status_code}"
        print("PASS: Rate limit cooldown correctly enforced (429)")

        # 3. Verify OTP record in database and SHA-256 hashing
        otp_rec = db.query(EmailOTP).filter(EmailOTP.email == test_email, EmailOTP.purpose == "register").first()
        assert otp_rec is not None
        assert otp_rec.attempts == 0
        assert len(otp_rec.otp_hash) == 64  # SHA-256 hex length
        print("PASS: EmailOTP record securely created with SHA-256 hash")

        # 4. Attempt verify with wrong OTP code
        res_wrong = client.post("/api/auth/register/verify-otp", json={
            "email": test_email,
            "otp": "000000"
        })
        assert res_wrong.status_code == 400
        assert "Invalid verification code" in res_wrong.json()["detail"]
        db.commit() # End repeatable read transaction
        otp_rec = db.query(EmailOTP).filter(EmailOTP.email == test_email, EmailOTP.purpose == "register").first()
        assert otp_rec.attempts == 1
        print("PASS: Wrong OTP rejected and attempt counter incremented")

        # 5. Verify with correct OTP
        # In test, we can set known OTP hash to verify completion
        known_code = "654321"
        otp_rec.otp_hash = hashlib.sha256(known_code.encode("utf-8")).hexdigest()
        db.commit()

        res_correct = client.post("/api/auth/register/verify-otp", json={
            "email": test_email,
            "otp": known_code
        })
        assert res_correct.status_code == 200, f"verify-otp failed: {res_correct.text}"
        auth_data = res_correct.json()
        assert "token" in auth_data
        assert auth_data["user"]["email"] == test_email
        assert auth_data["user"]["isVerified"] is True
        print("PASS: Correct OTP accepted, user created and JWT issued")

        # 6. Test Forgot Password Send OTP
        res_forgot_send = client.post("/api/auth/forgot-password/send-otp", json={
            "email": test_email
        })
        assert res_forgot_send.status_code == 200
        print("PASS: Forgot password send-otp returned 200")

        # 7. Test Forgot Password Reset with known code
        forgot_rec = db.query(EmailOTP).filter(
            EmailOTP.email == test_email,
            EmailOTP.purpose == "forgot_password",
            EmailOTP.is_used == False
        ).first()
        assert forgot_rec is not None
        reset_code = "789123"
        forgot_rec.otp_hash = hashlib.sha256(reset_code.encode("utf-8")).hexdigest()
        db.commit()

        new_password = "BrandNewPassword2026!"
        res_reset = client.post("/api/auth/forgot-password/verify-reset", json={
            "email": test_email,
            "otp": reset_code,
            "newPassword": new_password
        })
        assert res_reset.status_code == 200
        print("PASS: Forgot password reset verified and completed")

        # 8. Test Login with newly reset password
        res_login = client.post("/api/auth/login", json={
            "email": test_email,
            "password": new_password
        })
        assert res_login.status_code == 200
        assert "token" in res_login.json()
        print("PASS: Logged in successfully with updated password")

        # 9. Test Google Auth Endpoint (with profile payload)
        res_google = client.post("/api/auth/google", json={
            "email": "google_user_demo@gmail.com",
            "name": "Google Test Customer",
            "googleId": "goog-123456789"
        })
        assert res_google.status_code == 200
        g_data = res_google.json()
        assert g_data["user"]["email"] == "google_user_demo@gmail.com"
        assert g_data["user"]["authProvider"] == "google"
        assert g_data["user"]["isVerified"] is True
        print("PASS: Google authentication endpoint works seamlessly")

        print("\nALL AUTH & OTP BACKEND TESTS PASSED SUCCESSFULLY!")

    finally:
        # Cleanup
        db.query(EmailOTP).filter(EmailOTP.email.in_([test_email, "google_user_demo@gmail.com"])).delete(synchronize_session=False)
        db.query(User).filter(User.email.in_([test_email, "google_user_demo@gmail.com"])).delete(synchronize_session=False)
        db.commit()
        db.close()

if __name__ == "__main__":
    test_full_otp_and_auth_workflow()

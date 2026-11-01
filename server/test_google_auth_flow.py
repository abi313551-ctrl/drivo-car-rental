"""
Test script to verify Google Auth config & user serialization endpoints in Drivo.
"""
import sys
import os
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from database import get_db, SessionLocal
from models import User

client = TestClient(app)

def test_google_auth():
    print("==================================================")
    print("      DRIVO GOOGLE AUTHENTICATION TEST SUITE      ")
    print("==================================================")
    
    # 1. Config endpoint
    res_cfg = client.get("/api/auth/google/config")
    assert res_cfg.status_code == 200, f"Config failed: {res_cfg.status_code}"
    cfg_data = res_cfg.json()
    assert "client_id" in cfg_data, "client_id missing in /api/auth/google/config"
    print(f"  [PASS] /api/auth/google/config returned client_id: {cfg_data['client_id'][:25]}...")

    # 2. Mock Google ID Token verification
    fake_google_user = {
        "sub": "google_test_sub_998877",
        "email": "mathesh.google.test@gmail.com",
        "name": "Mathesh Google User",
        "picture": "https://lh3.googleusercontent.com/a/ACg8ocK_test_avatar_photo=s96-c",
        "email_verified": True
    }

    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=fake_google_user):
        payload = {
            "credential": "mock_google_id_jwt_token_sample",
            "email": "mathesh.google.test@gmail.com",
            "fullName": "Mathesh Google User",
            "googleId": "google_test_sub_998877",
            "picture": "https://lh3.googleusercontent.com/a/ACg8ocK_test_avatar_photo=s96-c"
        }
        res_auth = client.post("/api/auth/google", json=payload)
        assert res_auth.status_code == 200, f"Google auth failed: {res_auth.status_code} - {res_auth.text}"
        data = res_auth.json()
        assert "token" in data, "Token missing in response"
        assert "user" in data, "User missing in response"
        u = data["user"]
        
        assert u["email"] == "mathesh.google.test@gmail.com", f"Email mismatch: {u['email']}"
        assert u["fullName"] == "Mathesh Google User", f"Full name mismatch: {u['fullName']}"
        assert u["role"] == "customer", f"Role mismatch: {u['role']}"
        assert u.get("avatar") == fake_google_user["picture"], f"Avatar mismatch: {u.get('avatar')}"
        assert u.get("picture") == fake_google_user["picture"], f"Picture mismatch: {u.get('picture')}"
        print(f"  [PASS] /api/auth/google successfully created/authenticated Google user:")
        print(f"         Name: {u['fullName']}")
        print(f"         Email: {u['email']}")
        print(f"         Role: {u['role']}")
        print(f"         Avatar URL: {u['avatar'][:45]}...")

    # Clean up test user
    db = SessionLocal()
    try:
        user_in_db = db.query(User).filter(User.email == "mathesh.google.test@gmail.com").first()
        if user_in_db:
            db.delete(user_in_db)
            db.commit()
            print("  [PASS] Test Google user cleaned up from database.")
    finally:
        db.close()

    print("==================================================")
    print("   ALL GOOGLE AUTHENTICATION TESTS PASSED 100%!   ")
    print("==================================================")

if __name__ == "__main__":
    test_google_auth()

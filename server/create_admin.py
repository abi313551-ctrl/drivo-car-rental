import sys
import argparse
from pathlib import Path

# Ensure server module can be imported
sys.path.insert(0, str(Path(__file__).resolve().parent))

from database import SessionLocal
from models import User
from auth import hash_password

def create_or_promote_admin(email: str, password: str, full_name: str, phone: str = ""):
    db = SessionLocal()
    email_clean = email.strip().lower()
    try:
        user = db.query(User).filter(User.email == email_clean).first()
        if user:
            print(f"User with email '{email_clean}' exists (Current role: {user.role}).")
            user.role = "admin"
            if password:
                user.password_hash = hash_password(password)
            if full_name:
                user.full_name = full_name.strip()
            db.commit()
            print(f"SUCCESS: User '{email_clean}' successfully promoted to 'admin' role.")
        else:
            if not password:
                print("ERROR: Password is required to create a new admin user.")
                return False
            new_admin = User(
                full_name=full_name.strip() if full_name else "Drivo Administrator",
                email=email_clean,
                password_hash=hash_password(password),
                phone=phone.strip(),
                role="admin",
            )
            db.add(new_admin)
            db.commit()
            print(f"SUCCESS: New admin account '{email_clean}' created successfully with role 'admin'.")
        return True
    except Exception as exc:
        db.rollback()
        print(f"ERROR: Failed to create or promote admin: {exc}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create or promote an administrator account for Drivo.")
    parser.add_argument("--email", required=True, help="Administrator email address")
    parser.add_argument("--password", required=True, help="Secure password for admin account")
    parser.add_argument("--name", default="System Administrator", help="Full name of the admin")
    parser.add_argument("--phone", default="", help="Phone number (optional)")
    args = parser.parse_args()

    create_or_promote_admin(email=args.email, password=args.password, full_name=args.name, phone=args.phone)

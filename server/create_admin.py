"""
Secure Admin Account Setup Tool for Drivo Car Rental
Usage:
  Interactive prompt:
    python server/create_admin.py

  Non-interactive CLI:
    python server/create_admin.py --username drivo_owner --password "YourStrongPassword"

  Environment variables:
    ADMIN_USERNAME=drivo_owner ADMIN_PASSWORD="YourStrongPassword" python server/create_admin.py
"""

import os
import sys
import argparse
import getpass

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from database import get_db
from models import User
from auth import hash_password
from sqlalchemy import or_, func


def setup_admin(identifier: str, password: str, full_name: str = "Drivo Administrator", phone: str = "9876543210"):
    identifier = identifier.strip().lower()
    if not identifier:
        print("[ERROR] Please provide a valid username or email.")
        sys.exit(1)

    if not password or len(password) < 6:
        print("[ERROR] Password must be at least 6 characters long.")
        sys.exit(1)

    # Normalize email representation if a plain username like 'drivo_owner' is provided
    primary_email = identifier if "@" in identifier else f"{identifier}@drivo.com"

    db = next(get_db())
    try:
        # Check for existing admin matching username, primary email, or old admin demo
        existing = (
            db.query(User)
            .filter(
                or_(
                    func.lower(User.email) == primary_email,
                    func.lower(User.email) == identifier,
                    func.lower(User.full_name) == identifier,
                    User.email == "admin@drivo.example",
                )
            )
            .first()
        )
        hashed = hash_password(password)

        if existing:
            existing.email = primary_email
            existing.full_name = full_name if full_name != "Drivo Administrator" else (identifier if "@" not in identifier else "Drivo Administrator")
            existing.password_hash = hashed
            existing.role = "admin"
            existing.is_verified = True
            db.commit()
            print(f"[SUCCESS] Admin account updated successfully!")
            print(f"  Username / Login ID : {identifier}")
            print(f"  Associated Email    : {primary_email}")
            print(f"  Role                : admin")
            print(f"  Password Storage    : Bcrypt Hash (Secure)")
        else:
            new_admin = User(
                full_name=full_name if full_name != "Drivo Administrator" else identifier,
                email=primary_email,
                phone=phone,
                license_number="TN74-ADM-001",
                password_hash=hashed,
                role="admin",
                is_verified=True,
            )
            db.add(new_admin)
            db.commit()
            print(f"[SUCCESS] New Admin account created successfully!")
            print(f"  Username / Login ID : {identifier}")
            print(f"  Associated Email    : {primary_email}")
            print(f"  Role                : admin")
            print(f"  Password Storage    : Bcrypt Hash (Secure)")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Configure or update Drivo Admin account.")
    parser.add_argument("--username", "--email", dest="identifier", help="Administrator username or email")
    parser.add_argument("--password", help="Administrator password")
    parser.add_argument("--name", default="Drivo Administrator", help="Administrator display name")
    parser.add_argument("--phone", default="9876543210", help="Administrator phone number")
    args = parser.parse_args()

    identifier = args.identifier or os.getenv("ADMIN_USERNAME") or os.getenv("ADMIN_EMAIL")
    password = args.password or os.getenv("ADMIN_PASSWORD")
    name = args.name or os.getenv("ADMIN_NAME", "Drivo Administrator")
    phone = args.phone or os.getenv("ADMIN_PHONE", "9876543210")

    if not identifier:
        identifier = input("Enter Administrator Username or Email: ").strip()
    if not password:
        password = getpass.getpass("Enter Administrator Password: ").strip()

    setup_admin(identifier=identifier, password=password, full_name=name, phone=phone)


if __name__ == "__main__":
    main()

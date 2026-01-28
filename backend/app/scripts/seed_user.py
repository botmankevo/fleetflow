import argparse
import hashlib
import secrets

from app.core.database import get_session_factory
from app import models


def hash_password(plain: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac("sha256", plain.encode("utf-8"), salt, 120_000)
    return f"pbkdf2${salt.hex()}${derived.hex()}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed a carrier and user")
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--role", default="admin")
    parser.add_argument("--carrier-name", default="FleetFlow Carrier")
    parser.add_argument("--carrier-code", default="FF")
    parser.add_argument("--driver-name", default="")
    parser.add_argument("--driver-email", default="")
    parser.add_argument("--driver-phone", default="")
    args = parser.parse_args()

    SessionLocal = get_session_factory()
    db = SessionLocal()
    try:
        carrier = db.query(models.Carrier).filter(models.Carrier.internal_code == args.carrier_code).first()
        if not carrier:
            carrier = models.Carrier(name=args.carrier_name, internal_code=args.carrier_code)
            db.add(carrier)
            db.commit()
            db.refresh(carrier)

        driver = None
        if args.driver_name:
            driver = db.query(models.Driver).filter(
                models.Driver.carrier_id == carrier.id,
                models.Driver.email == (args.driver_email or None),
            ).first()
            if not driver:
                driver = models.Driver(
                    carrier_id=carrier.id,
                    name=args.driver_name,
                    email=args.driver_email or None,
                    phone=args.driver_phone or None,
                )
                db.add(driver)
                db.commit()
                db.refresh(driver)

        user = db.query(models.User).filter(models.User.email == args.email).first()
        if user:
            user.role = args.role
            user.carrier_id = carrier.id
            if driver:
                user.driver_id = driver.id
            user.password_hash = hash_password(args.password)
        else:
            user = models.User(
                email=args.email,
                password_hash=hash_password(args.password),
                role=args.role,
                carrier_id=carrier.id,
                driver_id=driver.id if driver else None,
                is_active=True,
            )
            db.add(user)
        db.commit()
    finally:
        db.close()

    print("Seeded user:", args.email)


if __name__ == "__main__":
    main()

"""Seed script to create initial platform owner user."""
import argparse
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.security import hash_password
from app.core.database import Base
from app.models.models import User, Role


def main():
    """Create a new user."""
    parser = argparse.ArgumentParser(description="Create a new platform owner user")
    parser.add_argument("--email", required=True, help="User email")
    parser.add_argument("--password", required=True, help="User password")
    parser.add_argument("--role", default="platform_owner", help="User role")
    parser.add_argument("--full-name", default="Admin", help="User full name")
    
    args = parser.parse_args()
    
    # Create engine and session
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Check if user already exists
        existing = db.query(User).filter(User.email == args.email).first()
        if existing:
            print(f"❌ User with email {args.email} already exists")
            sys.exit(1)
        
        # Create user
        user = User(
            email=args.email,
            full_name=args.full_name,
            hashed_password=hash_password(args.password),
            role=args.role,
            tenant_id=None,  # Platform owner has no tenant
            is_active=True
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print(f"✓ {args.role.replace('_', ' ').title()} user created: {args.email} (ID: {user.id})")
        sys.exit(0)
    
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating user: {str(e)}")
        sys.exit(1)
    
    finally:
        db.close()


if __name__ == "__main__":
    main()

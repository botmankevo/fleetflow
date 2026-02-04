"""
Seed sample loads data for testing
"""
import sys
import os
from datetime import datetime, timedelta
import random

# Add the parent directory to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy.orm import Session
from app.core.database import get_session_factory
from app.models import Load, User, Driver

def seed_loads():
    SessionLocal = get_session_factory()
    db = SessionLocal()
    
    try:
        # Get the first user/carrier
        user = db.query(User).first()
        if not user:
            print("❌ No user found. Create a user first with seed_user.py")
            return
        
        print(f"✅ Found user: {user.email} (carrier_id: {user.carrier_id})")
        
        # Get or create a driver
        driver = db.query(Driver).filter(Driver.carrier_id == user.carrier_id).first()
        driver_id = driver.id if driver else None
        driver_name = driver.name if driver else None
        
        # Sample load data
        cities = [
            ("Houston", "TX", "77001"),
            ("Dallas", "TX", "75201"),
            ("Los Angeles", "CA", "90001"),
            ("Chicago", "IL", "60601"),
            ("New York", "NY", "10001"),
            ("Miami", "FL", "33101"),
            ("Atlanta", "GA", "30301"),
            ("Phoenix", "AZ", "85001"),
            ("San Antonio", "TX", "78201"),
            ("Memphis", "TN", "38101"),
        ]
        
        brokers = [
            "ALCO USA LLP",
            "TQL",
            "C.H. Robinson",
            "Coyote Logistics",
            "XPO Logistics"
        ]
        
        statuses = ["new", "dispatched", "in_transit", "delivered", "invoiced"]
        
        print("\n🚛 Creating sample loads...")
        
        for i in range(1, 16):  # Create 15 loads
            pickup_city = random.choice(cities)
            delivery_city = random.choice([c for c in cities if c != pickup_city])
            
            # Calculate random distance
            total_miles = random.randint(200, 1500)
            rate_per_mile = round(random.uniform(1.80, 3.50), 2)
            broker_rate = round(total_miles * rate_per_mile, 2)
            
            # Random dates
            pickup_date = datetime.now() + timedelta(days=random.randint(-5, 5))
            delivery_date = pickup_date + timedelta(days=random.randint(1, 3))
            
            # Create pickup address
            pickup_addr = f"{random.randint(100, 9999)} Industrial Blvd, {pickup_city[0]}, {pickup_city[1]} {pickup_city[2]}"
            delivery_addr = f"{random.randint(100, 9999)} Commerce Dr, {delivery_city[0]}, {delivery_city[1]} {delivery_city[2]}"
            
            load = Load(
                load_number=f"{1140 + i}",
                carrier_id=user.carrier_id,
                status=random.choice(statuses),
                broker_name=random.choice(brokers),
                po_number=f"PO{random.randint(10000, 99999)}",
                rate_amount=broker_rate,
                pickup_address=pickup_addr,
                delivery_address=delivery_addr,
                notes=f"Load from {pickup_city[0]} to {delivery_city[0]}. {total_miles} miles at ${rate_per_mile}/mi",
                driver_id=driver_id if random.random() > 0.5 else None,
            )
            
            db.add(load)
            print(f"  ✅ Load #{load.load_number}: {pickup_city[0]}, {pickup_city[1]} → {delivery_city[0]}, {delivery_city[1]} (${broker_rate:.2f})")
        
        db.commit()
        print(f"\n✅ Successfully created 15 sample loads!")
        print(f"\n🚀 Refresh the page: http://localhost:3000/admin/loads")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_loads()

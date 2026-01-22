from app.db.session import SessionLocal
from app.models.models import User, Load
from app.utils.security import hash_password


def seed():
    db = SessionLocal()
    if db.query(User).first():
        print("Seed data already exists")
        return

    admin = User(name="Admin", email="admin@coxtnl.com", role="admin", password_hash=hash_password("password"))
    dispatcher = User(name="Dispatcher", email="dispatch@coxtnl.com", role="dispatcher", password_hash=hash_password("password"))
    driver = User(name="Driver", email="driver@coxtnl.com", role="driver", password_hash=hash_password("password"))
    db.add_all([admin, dispatcher, driver])
    db.commit()

    load = Load(
        load_id="COX-1001",
        commodity="Produce",
        broker_info_text="Example Broker\n(555) 111-2222",
        pickup_name="Fresh Farms",
        pickup_address="123 Farm Rd, Houston, TX",
        delivery_name="Market Hub",
        delivery_address="987 Market St, Dallas, TX",
        delivery_date="2024-11-01",
        status="assigned",
        assigned_driver_id=driver.id,
    )
    db.add(load)
    db.commit()
    db.close()
    print("Seeded data")


if __name__ == "__main__":
    seed()

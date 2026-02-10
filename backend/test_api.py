import sys
sys.path.insert(0, '/app')

from app.core.database import get_db
from app.models import Customer

db = next(get_db())

total = db.query(Customer).count()
print(f"Total customers in database: {total}")

carriers = db.query(Customer.carrier_id).distinct().all()
print(f"\nCustomers by carrier:")
for (carrier_id,) in carriers:
    count = db.query(Customer).filter(Customer.carrier_id == carrier_id).count()
    print(f"  Carrier {carrier_id}: {count} customers")

print(f"\nFirst 5 customers:")
for c in db.query(Customer).limit(5).all():
    print(f"  ID: {c.id}, Name: {c.company_name}, Carrier: {c.carrier_id}, Type: {c.customer_type}")

db.close()

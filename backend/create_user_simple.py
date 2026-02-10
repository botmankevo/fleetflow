"""Create admin user using app's security module"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.core.database import get_engine
from app.core.security import get_password_hash
from datetime import datetime

print("Creating admin user...")

engine = get_engine()
with engine.connect() as conn:
    # Check/create carrier
    result = conn.execute(text('SELECT id FROM carriers LIMIT 1'))
    carrier = result.fetchone()
    if not carrier:
        print("Creating carrier...")
        conn.execute(text("INSERT INTO carriers (name, code, created_at) VALUES ('Cox Transport & Logistics', 'COX', :created_at)"), 
                    {"created_at": datetime.utcnow()})
        conn.commit()
        result = conn.execute(text('SELECT id FROM carriers LIMIT 1'))
        carrier = result.fetchone()
    
    carrier_id = carrier[0]
    print(f"✓ Using carrier ID: {carrier_id}")
    
    # Check if user exists
    result = conn.execute(text('SELECT id, email FROM users WHERE email = :email'), {'email': 'admin@maintms.com'})
    existing = result.fetchone()
    if existing:
        print(f"✓ Admin user already exists: {existing[1]}")
    else:
        # Hash password using app's security module
        hashed_password = get_password_hash('admin123')
        
        # Insert admin user
        conn.execute(text('''
            INSERT INTO users (email, hashed_password, full_name, role, carrier_id, is_active, created_at)
            VALUES (:email, :password, :name, :role, :carrier_id, 1, :created_at)
        '''), {
            'email': 'admin@maintms.com',
            'password': hashed_password,
            'name': 'Admin User',
            'role': 'admin',
            'carrier_id': carrier_id,
            'created_at': datetime.utcnow()
        })
        conn.commit()
        print('✓ Admin user created successfully!')
        print('  Email: admin@maintms.com')
        print('  Password: admin123')

    # Verify
    result = conn.execute(text('SELECT COUNT(*) FROM users'))
    print(f'\n✓ Total users in database: {result.scalar()}')
    
    # Verify customers
    result = conn.execute(text('SELECT COUNT(*) FROM customers'))
    print(f'✓ Total customers in database: {result.scalar()}')

print("\n✅ Setup complete! Ready to login.")

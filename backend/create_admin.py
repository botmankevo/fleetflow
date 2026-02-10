"""Create admin user"""
from sqlalchemy import create_engine, text
from passlib.context import CryptContext
from datetime import datetime

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
hashed_password = pwd_context.hash('admin123')

engine = create_engine('sqlite:///./app.db')
with engine.connect() as conn:
    # Create carrier first if not exists
    result = conn.execute(text('SELECT id FROM carriers LIMIT 1'))
    carrier = result.fetchone()
    if not carrier:
        conn.execute(text("INSERT INTO carriers (name, code) VALUES ('Cox Transport & Logistics', 'COX')"))
        conn.commit()
        result = conn.execute(text('SELECT id FROM carriers LIMIT 1'))
        carrier = result.fetchone()
    
    carrier_id = carrier[0]
    print(f'Using carrier ID: {carrier_id}')
    
    # Check if user exists
    result = conn.execute(text('SELECT id FROM users WHERE email = :email'), {'email': 'admin@maintms.com'})
    if result.fetchone():
        print('Admin user already exists')
    else:
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

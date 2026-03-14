import sys
import os

# Add the backend directory to sys.path
sys.path.append(r'c:\Users\my self\.gemini\antigravity\scratch\MainTMS\backend')

from app.core.database import get_engine, Base
from app.models import FinancialSettings, Expense, Load, Carrier
from sqlalchemy import text

engine = get_engine()

print("Synchronizing database schema...")
try:
    # Create new tables
    Base.metadata.create_all(bind=engine)
    print("New tables created if they were missing.")
    
    from sqlalchemy import inspect
    inspector = inspect(engine)
    
    # helper to add column if not exists
    def add_column(table_name, column_name, col_type, default=None):
        columns = [c['name'] for c in inspector.get_columns(table_name)]
        if column_name not in columns:
            print(f"Adding '{column_name}' to {table_name} table...")
            with engine.connect() as conn:
                default_clause = f" DEFAULT {default}" if default else ""
                sql = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {col_type}{default_clause}"
                conn.execute(text(sql))
                conn.commit()
            print("Column added.")
        else:
            print(f"'{column_name}' already exists in {table_name}.")

    add_column('expenses', 'expense_type', 'VARCHAR(50)', "'variable'")
    add_column('carriers', 'logo_url', 'VARCHAR(500)')
    add_column('carriers', 'address', 'VARCHAR(500)')
    add_column('carriers', 'phone', 'VARCHAR(50)')
    add_column('carriers', 'email', 'VARCHAR(255)')
    add_column('loads', 'load_type', 'VARCHAR(50)', "'Full'")
    add_column('loads', 'rate_per_mile', 'FLOAT')
    add_column('loads', 'total_miles', 'FLOAT')
    add_column('loads', 'deadhead_miles', 'FLOAT', '0.0')

except Exception as e:
    print(f"Error: {e}")

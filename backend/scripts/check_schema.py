from sqlalchemy import create_engine, text
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://main_tms:main_tms@db:5432/main_tms")
engine = create_engine(DATABASE_URL)

def check_tables():
    tables = ["loads", "load_stops", "customers", "drivers", "financial_settings"]
    with engine.connect() as conn:
        for table in tables:
            print(f"\nChecking table: {table}")
            try:
                result = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}'"))
                columns = [row[0] for row in result]
                print(f"Columns: {columns}")
            except Exception as e:
                print(f"Error checking {table}: {e}")

if __name__ == "__main__":
    check_tables()

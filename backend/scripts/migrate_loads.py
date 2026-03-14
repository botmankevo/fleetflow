from sqlalchemy import create_engine, text
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://main_tms:main_tms@db:5432/main_tms")
engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Checking 'loads' table columns...")
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='loads'"))
        columns = [row[0] for row in result]
        print(f"Existing columns: {columns}")
        
        # List of columns that SHOULD exist in 'loads'
        required_columns = [
            ("load_type", "VARCHAR(50) DEFAULT 'Full'"),
            ("weight", "FLOAT"),
            ("pallets", "INTEGER"),
            ("length_ft", "FLOAT"),
            ("rate_amount", "FLOAT"),
            ("fuel_surcharge", "FLOAT DEFAULT 0.0"),
            ("detention", "FLOAT DEFAULT 0.0"),
            ("layover", "FLOAT DEFAULT 0.0"),
            ("lumper", "FLOAT DEFAULT 0.0"),
            ("other_fees", "FLOAT DEFAULT 0.0"),
            ("total_miles", "FLOAT"),
            ("deadhead_miles", "FLOAT DEFAULT 0.0"),
            ("rate_per_mile", "FLOAT"),
            ("pickup_address", "TEXT"),
            ("pickup_date", "TIMESTAMP"),
            ("delivery_address", "TEXT"),
            ("delivery_date", "TIMESTAMP"),
            ("notes", "TEXT"),
            ("rc_document", "TEXT"),
            ("bol_document", "TEXT"),
            ("pod_document", "TEXT"),
            ("invoice_document", "TEXT"),
            ("receipt_document", "TEXT"),
            ("other_document", "TEXT"),
            ("broker_mc", "VARCHAR(50)"),
            ("broker_dot", "VARCHAR(50)"),
            ("broker_verified", "BOOLEAN DEFAULT FALSE"),
            ("broker_verified_at", "TIMESTAMP"),
            ("po_number", "VARCHAR(100)"),
            ("truck_id", "INTEGER"),
            ("trailer_id", "INTEGER"),
            ("customer_id", "INTEGER"),
            ("updated_at", "TIMESTAMP")
        ]
        
        for col_name, col_type in required_columns:
            if col_name not in columns:
                print(f"Adding column '{col_name}'...")
                try:
                    conn.execute(text(f"ALTER TABLE loads ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                    print(f"Successfully added '{col_name}'")
                except Exception as e:
                    print(f"Error adding '{col_name}': {e}")
        # List of columns for 'load_stops'
        required_load_stops = [
            ("company", "VARCHAR(200)"),
            ("address", "TEXT"),
            ("city", "VARCHAR(100)"),
            ("state", "VARCHAR(20)"),
            ("zip_code", "VARCHAR(20)"),
            ("latitude", "FLOAT"),
            ("longitude", "FLOAT"),
            ("date", "VARCHAR(20)"),
            ("time", "VARCHAR(20)"),
            ("phone", "VARCHAR(50)"),
            ("website", "VARCHAR(500)"),
            ("hours", "VARCHAR(200)"),
            ("miles_to_next_stop", "FLOAT")
        ]
        
        print("\nChecking 'load_stops' table columns...")
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='load_stops'"))
        ls_columns = [row[0] for row in result]
        
        for col_name, col_type in required_load_stops:
            if col_name not in ls_columns:
                print(f"Adding column '{col_name}' to load_stops...")
                try:
                    conn.execute(text(f"ALTER TABLE load_stops ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                    print(f"Successfully added '{col_name}' to load_stops")
                except Exception as e:
                    print(f"Error adding '{col_name}' to load_stops: {e}")
            else:
                print(f"Column '{col_name}' already exists in load_stops.")

if __name__ == "__main__":
    migrate()

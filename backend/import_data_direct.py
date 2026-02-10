"""
Direct data import script - imports brokers, shippers, and loads
Uses direct SQL approach to avoid model dependencies
"""
import pandas as pd
from sqlalchemy import create_engine, text
from datetime import datetime
import os

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
engine = create_engine(DATABASE_URL)


def clean_str(val):
    """Convert value to string and clean it"""
    if pd.isna(val):
        return None
    s = str(val).strip()
    if s.lower() == 'nan':
        return None
    # Fix float string issues like '12345.0' -> '12345'
    if s.endswith('.0'):
        try:
            float(s)
            return s[:-2]
        except ValueError:
            pass
    return s

def import_brokers(file_path, carrier_id=1):
    """Import brokers from Excel"""
    print(f"\n📦 Importing brokers from {file_path}...")
    
    try:
        df = pd.read_excel(file_path)
        print(f"Found {len(df)} rows in brokers file")
        # Ensure all columns are handled
        # print(f"Columns: {df.columns.tolist()}")
        
        imported = 0
        skipped = 0
        
        with engine.connect() as conn:
            for idx, row in df.iterrows():
                # Extract company name (try different column variations)
                company_name = None
                for col in ['Company', 'company', 'Name', 'name', 'Company Name', 'company_name']:
                    if col in df.columns and pd.notna(row.get(col)):
                        company_name = clean_str(row[col])
                        break
                
                if not company_name:
                    skipped += 1
                    continue
                
                # Check if exists
                result = conn.execute(text(
                    "SELECT id FROM customers WHERE company_name = :name AND carrier_id = :carrier_id"
                ), {"name": company_name, "carrier_id": carrier_id})
                
                if result.fetchone():
                    skipped += 1
                    continue
                
                # Extract other fields
                email = None
                phone = None
                mc_number = None
                contact_name = None
                address = None
                city = None
                state = None
                zip_code = None
                
                # Iterate columns safely
                # Use hardcoded mappings if possible for known columns
                # Brokers: ['Company', 'Type', 'Address', 'Address Line 2', 'City', 'State', 'Zip', 'Phone', 'Email', 'Billing Email', 'FID/EIN', 'MC']
                
                if 'Email' in df.columns: email = clean_str(row.get('Email'))
                if 'Phone' in df.columns: phone = clean_str(row.get('Phone'))
                if 'MC' in df.columns: mc_number = clean_str(row.get('MC'))
                if 'Contact' in df.columns: contact_name = clean_str(row.get('Contact'))
                if 'Address' in df.columns: address = clean_str(row.get('Address'))
                if 'City' in df.columns: city = clean_str(row.get('City'))
                if 'State' in df.columns: state = clean_str(row.get('State'))
                if 'Zip' in df.columns: zip_code = clean_str(row.get('Zip'))
                
                # Fallback to fuzzy match if direct keys fail
                if not email:
                    for col in df.columns:
                        if 'email' in col.lower() and pd.notna(row[col]): email = clean_str(row[col])
                if not phone:
                    for col in df.columns:
                        if 'phone' in col.lower() and pd.notna(row[col]): phone = clean_str(row[col])

                # Insert
                conn.execute(text("""
                    INSERT INTO customers (
                        carrier_id, company_name, mc_number, customer_type,
                        contact_name, email, phone, address, city, state, zip_code,
                        payment_terms, is_active, created_at, updated_at
                    ) VALUES (
                        :carrier_id, :company_name, :mc_number, :customer_type,
                        :contact_name, :email, :phone, :address, :city, :state, :zip_code,
                        :payment_terms, :is_active, :created_at, :updated_at
                    )
                """), {
                    "carrier_id": carrier_id,
                    "company_name": company_name,
                    "mc_number": mc_number,
                    "customer_type": "broker",
                    "contact_name": contact_name,
                    "email": email,
                    "phone": phone,
                    "address": address,
                    "city": city,
                    "state": state,
                    "zip_code": zip_code,
                    "payment_terms": "Net 30",
                    "is_active": True,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                })
                conn.commit()
                imported += 1
                
                if imported % 10 == 0:
                    print(f"  Imported {imported} brokers...")
        
        print(f"✅ Successfully imported {imported} brokers")
        print(f"⚠️  Skipped {skipped} rows (duplicates or invalid)")
        return imported
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 0


def import_shippers(file_path, carrier_id=1):
    """Import shippers from Excel"""
    print(f"\n📦 Importing shippers from {file_path}...")
    
    try:
        df = pd.read_excel(file_path)
        print(f"Found {len(df)} rows in shippers file")
        
        imported = 0
        skipped = 0
        
        with engine.connect() as conn:
            for idx, row in df.iterrows():
                # Extract company name
                company_name = None
                for col in ['Company', 'company', 'Name', 'name', 'Company Name', 'company_name']:
                    if col in df.columns and pd.notna(row.get(col)):
                        company_name = clean_str(row[col])
                        break
                
                if not company_name:
                    skipped += 1
                    continue
                
                # Check if exists
                result = conn.execute(text(
                    "SELECT id FROM customers WHERE company_name = :name AND carrier_id = :carrier_id"
                ), {"name": company_name, "carrier_id": carrier_id})
                
                if result.fetchone():
                    skipped += 1
                    continue
                
                # Extract fields
                email = None
                phone = None
                address = None
                city = None
                state = None
                zip_code = None
                
                # Direct check
                if 'Email' in df.columns: email = clean_str(row.get('Email'))
                if 'Phone' in df.columns: phone = clean_str(row.get('Phone'))
                if 'Address' in df.columns: address = clean_str(row.get('Address'))
                if 'City' in df.columns: city = clean_str(row.get('City'))
                if 'State' in df.columns: state = clean_str(row.get('State'))
                if 'Zip' in df.columns: zip_code = clean_str(row.get('Zip'))
                
                # Insert
                conn.execute(text("""
                    INSERT INTO customers (
                        carrier_id, company_name, customer_type,
                        email, phone, address, city, state, zip_code,
                        payment_terms, is_active, created_at, updated_at
                    ) VALUES (
                        :carrier_id, :company_name, :customer_type,
                        :email, :phone, :address, :city, :state, :zip_code,
                        :payment_terms, :is_active, :created_at, :updated_at
                    )
                """), {
                    "carrier_id": carrier_id,
                    "company_name": company_name,
                    "customer_type": "shipper",
                    "email": email,
                    "phone": phone,
                    "address": address,
                    "city": city,
                    "state": state,
                    "zip_code": zip_code,
                    "payment_terms": "Net 30",
                    "is_active": True,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                })
                conn.commit()
                imported += 1
                
                if imported % 10 == 0:
                    print(f"  Imported {imported} shippers...")
        
        print(f"✅ Successfully imported {imported} shippers")
        print(f"⚠️  Skipped {skipped} rows (duplicates or invalid)")
        return imported
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 0

def import_drivers(file_path, carrier_id=1):
    """Import drivers from Excel"""
    print(f"\n📦 Importing drivers from {file_path}...")
    
    try:
        df = pd.read_excel(file_path)
        print(f"Found {len(df)} rows in drivers file")
        
        imported = 0
        skipped = 0
        
        with engine.connect() as conn:
            for idx, row in df.iterrows():
                name = None
                # Construct name from First/Last if present
                first_name = clean_str(row.get('First Name'))
                last_name = clean_str(row.get('Last Name'))
                
                if first_name and last_name:
                    name = f"{first_name} {last_name}"
                elif first_name:
                    name = first_name
                else:
                    # Fallback
                    for col in ['Name', 'name', 'Driver Name', 'driver_name', 'Full Name']:
                        if col in df.columns and pd.notna(row.get(col)):
                            name = clean_str(row[col])
                            break
                
                if not name:
                    skipped += 1
                    continue
                
                # Check exist
                res = conn.execute(text("SELECT id FROM drivers WHERE name = :name AND carrier_id = :cid"), {"name": name, "cid": carrier_id})
                if res.fetchone():
                    skipped += 1
                    continue
                
                email = clean_str(row.get('Email'))
                phone = clean_str(row.get('Phone'))
                # Additional logic for CDL (if needed later)
                
                conn.execute(text("""
                    INSERT INTO drivers (carrier_id, name, email, phone, created_at)
                    VALUES (:cid, :name, :email, :phone, :now)
                """), {
                    "cid": carrier_id, "name": name, "email": email, "phone": phone,
                    "now": datetime.utcnow()
                })
                conn.commit()
                imported += 1
        
        print(f"✅ Successfully imported {imported} drivers")
        return imported
    except Exception as e:
        print(f"❌ Error importing drivers: {e}")
        import traceback
        traceback.print_exc()
        return 0


def import_equipment(file_path, eq_type, carrier_id=1):
    """Import trucks or trailers"""
    print(f"\n📦 Importing {eq_type}s from {file_path}...")
    
    try:
        df = pd.read_excel(file_path)
        print(f"Found {len(df)} rows")
        
        imported = 0
        skipped = 0
        
        with engine.connect() as conn:
            for idx, row in df.iterrows():
                identifier = None
                # Unit number, VIN, ID
                for col in ['Unit', 'unit', 'ID', 'id', 'Identifier', 'Truck #', 'Trailer #', 'VIN']:
                    if col in df.columns and pd.notna(row.get(col)):
                        identifier = str(row[col]).strip()
                        break
                
                if not identifier:
                    skipped += 1
                    continue
                
                # Check exist
                res = conn.execute(text("SELECT id FROM equipment WHERE identifier = :id AND carrier_id = :cid"), {"id": identifier, "cid": carrier_id})
                if res.fetchone():
                    skipped += 1
                    continue
                
                conn.execute(text("""
                    INSERT INTO equipment (carrier_id, equipment_type, identifier, status, created_at, updated_at)
                    VALUES (:cid, :type, :id, 'available', :now, :now)
                """), {
                    "cid": carrier_id, "type": eq_type, "id": identifier,
                    "now": datetime.utcnow()
                })
                conn.commit()
                imported += 1
                
        print(f"✅ Successfully imported {imported} {eq_type}s")
        return imported
    except Exception as e:
        print(f"❌ Error importing {eq_type}s: {e}")
        return 0

def main():
    """Run import"""
    print("=" * 60)
    print("🚀 MainTMS - Real Data Import")
    print("=" * 60)
    
    total = 0
    
    # Import brokers
    brokers_file = "seed_data/brokers.xlsx"
    if os.path.exists(brokers_file):
        total += import_brokers(brokers_file)
    else:
        print(f"⚠️  File not found: {brokers_file} (Checked relative to script)")
    
    # Import shippers
    shippers_file = "seed_data/shippers.xlsx"
    if os.path.exists(shippers_file):
        total += import_shippers(shippers_file)
    else:
        print(f"⚠️  File not found: {shippers_file}")

    # Import drivers
    drivers_file = "seed_data/drivers.xlsx"
    if os.path.exists(drivers_file):
        total += import_drivers(drivers_file)
    else:
        print(f"⚠️  File not found: {drivers_file}")

    # Import trucks
    trucks_file = "seed_data/trucks.xlsx"
    if os.path.exists(trucks_file):
        total += import_equipment(trucks_file, "truck")
    else:
        print(f"⚠️  File not found: {trucks_file}")

    # Import trailers
    trailers_file = "seed_data/trailers.xlsx"
    if os.path.exists(trailers_file):
        total += import_equipment(trailers_file, "trailer")
    else:
        print(f"⚠️  File not found: {trailers_file}")
    
    print("\n" + "=" * 60)
    print(f"✅ Import Complete! Total records processed: {total}")
    print("=" * 60)

if __name__ == "__main__":
    main()

"""
Import Real Business Data from Excel Files
Imports brokers, shippers, and loads from user's real data files.
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy.orm import Session
from app.core.database import get_engine, get_session_factory, Base
from app.models import Customer, Load, User
from datetime import datetime, timedelta
import pandas as pd
import random


def import_brokers(db: Session, file_path: str):
    """Import brokers/customers from Excel file."""
    print(f"\n📦 Importing brokers from {file_path}...")
    
    try:
        df = pd.read_excel(file_path)
        print(f"Found {len(df)} rows in brokers file")
        print(f"Columns: {df.columns.tolist()}")
        
        imported_count = 0
        skipped_count = 0
        
        for idx, row in df.iterrows():
            try:
                # Extract data from row (adjust column names based on actual file)
                # Common column names: Company, Contact, Email, Phone, MC, Payment Terms
                customer_data = {}
                
                # Try different column name variations
                for col in df.columns:
                    col_lower = col.lower().strip()
                    
                    if 'company' in col_lower or 'name' in col_lower:
                        customer_data['name'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'contact' in col_lower and 'email' not in col_lower:
                        customer_data['contact_name'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'email' in col_lower:
                        customer_data['email'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'phone' in col_lower:
                        customer_data['phone'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'mc' in col_lower and 'number' not in col_lower:
                        customer_data['mc_number'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'payment' in col_lower or 'terms' in col_lower:
                        customer_data['payment_terms'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'address' in col_lower:
                        customer_data['address'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'city' in col_lower:
                        customer_data['city'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'state' in col_lower:
                        customer_data['state'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'zip' in col_lower:
                        customer_data['zip_code'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'note' in col_lower or 'comment' in col_lower:
                        customer_data['notes'] = str(row[col]).strip() if pd.notna(row[col]) else None
                
                # Skip if no name
                if not customer_data.get('name'):
                    skipped_count += 1
                    continue
                
                # Check if customer already exists
                existing = db.query(Customer).filter(Customer.company_name == customer_data['name']).first()
                if existing:
                    print(f"  ⚠️  Skipping duplicate: {customer_data['name']}")
                    skipped_count += 1
                    continue
                
                # Create customer
                customer = Customer(
                    carrier_id=1,
                    customer_type="broker",
                    company_name=customer_data.get('name'),
                    contact_name=customer_data.get('contact_name'),
                    email=customer_data.get('email'),
                    phone=customer_data.get('phone'),
                    mc_number=customer_data.get('mc_number'),
                    payment_terms=customer_data.get('payment_terms', 'Net 30'),
                    address=customer_data.get('address'),
                    city=customer_data.get('city'),
                    state=customer_data.get('state'),
                    zip_code=customer_data.get('zip_code'),
                    notes=customer_data.get('notes'),
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                
                db.add(customer)
                imported_count += 1
                
                if imported_count % 10 == 0:
                    print(f"  Imported {imported_count} customers...")
                    
            except Exception as e:
                print(f"  ❌ Error importing row {idx}: {e}")
                continue
        
        db.commit()
        print(f"✅ Successfully imported {imported_count} brokers/customers")
        print(f"⚠️  Skipped {skipped_count} rows (duplicates or invalid)")
        return imported_count
        
    except Exception as e:
        print(f"❌ Error reading brokers file: {e}")
        db.rollback()
        return 0


def import_shippers(db: Session, file_path: str):
    """Import shippers/receivers from Excel file."""
    print(f"\n📦 Importing shippers/receivers from {file_path}...")
    
    try:
        df = pd.read_excel(file_path)
        print(f"Found {len(df)} rows in shippers file")
        print(f"Columns: {df.columns.tolist()}")
        
        # Store as customers with type 'shipper' or store in notes
        imported_count = 0
        skipped_count = 0
        
        for idx, row in df.iterrows():
            try:
                shipper_data = {}
                
                # Extract data
                for col in df.columns:
                    col_lower = col.lower().strip()
                    
                    if 'company' in col_lower or 'name' in col_lower:
                        shipper_data['name'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'contact' in col_lower and 'email' not in col_lower:
                        shipper_data['contact_name'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'email' in col_lower:
                        shipper_data['email'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'phone' in col_lower:
                        shipper_data['phone'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'address' in col_lower:
                        shipper_data['address'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'city' in col_lower:
                        shipper_data['city'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'state' in col_lower:
                        shipper_data['state'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'zip' in col_lower:
                        shipper_data['zip_code'] = str(row[col]).strip() if pd.notna(row[col]) else None
                
                if not shipper_data.get('name'):
                    skipped_count += 1
                    continue
                
                # Check if already exists
                existing = db.query(Customer).filter(Customer.company_name == shipper_data['name']).first()
                if existing:
                    skipped_count += 1
                    continue
                
                # Create customer with shipper note
                customer = Customer(
                    carrier_id=1,
                    customer_type="shipper",
                    company_name=shipper_data.get('name'),
                    contact_name=shipper_data.get('contact_name'),
                    email=shipper_data.get('email'),
                    phone=shipper_data.get('phone'),
                    address=shipper_data.get('address'),
                    city=shipper_data.get('city'),
                    state=shipper_data.get('state'),
                    zip_code=shipper_data.get('zip_code'),
                    notes='Shipper/Receiver location',
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                
                db.add(customer)
                imported_count += 1
                
                if imported_count % 10 == 0:
                    print(f"  Imported {imported_count} shippers...")
                    
            except Exception as e:
                print(f"  ❌ Error importing row {idx}: {e}")
                continue
        
        db.commit()
        print(f"✅ Successfully imported {imported_count} shippers/receivers")
        print(f"⚠️  Skipped {skipped_count} rows (duplicates or invalid)")
        return imported_count
        
    except Exception as e:
        print(f"❌ Error reading shippers file: {e}")
        db.rollback()
        return 0


def import_loads(db: Session, file_path: str):
    """Import historical loads from Excel file."""
    print(f"\n📦 Importing loads from {file_path}...")
    
    try:
        df = pd.read_excel(file_path)
        print(f"Found {len(df)} rows in loads file")
        print(f"Columns: {df.columns.tolist()}")
        
        # Get a default user for loads (admin or first user)
        default_user = db.query(User).first()
        if not default_user:
            print("⚠️  No users found. Please create a user first.")
            return 0
        
        imported_count = 0
        skipped_count = 0
        
        for idx, row in df.iterrows():
            try:
                load_data = {}
                
                # Extract load data
                for col in df.columns:
                    col_lower = col.lower().strip()
                    
                    if 'load' in col_lower and 'number' in col_lower:
                        load_data['load_number'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'customer' in col_lower or 'broker' in col_lower:
                        load_data['customer_name'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'origin' in col_lower or 'pickup' in col_lower:
                        if 'city' in col_lower:
                            load_data['origin_city'] = str(row[col]).strip() if pd.notna(row[col]) else None
                        elif 'state' in col_lower:
                            load_data['origin_state'] = str(row[col]).strip() if pd.notna(row[col]) else None
                        else:
                            load_data['origin'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'destination' in col_lower or 'delivery' in col_lower:
                        if 'city' in col_lower:
                            load_data['destination_city'] = str(row[col]).strip() if pd.notna(row[col]) else None
                        elif 'state' in col_lower:
                            load_data['destination_state'] = str(row[col]).strip() if pd.notna(row[col]) else None
                        else:
                            load_data['destination'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'rate' in col_lower or 'revenue' in col_lower:
                        try:
                            load_data['rate'] = float(row[col]) if pd.notna(row[col]) else None
                        except:
                            pass
                    elif 'distance' in col_lower or 'miles' in col_lower:
                        try:
                            load_data['distance'] = float(row[col]) if pd.notna(row[col]) else None
                        except:
                            pass
                    elif 'weight' in col_lower:
                        try:
                            load_data['weight'] = float(row[col]) if pd.notna(row[col]) else None
                        except:
                            pass
                    elif 'status' in col_lower:
                        load_data['status'] = str(row[col]).strip() if pd.notna(row[col]) else None
                    elif 'date' in col_lower:
                        if 'pickup' in col_lower:
                            load_data['pickup_date'] = row[col] if pd.notna(row[col]) else None
                        elif 'delivery' in col_lower:
                            load_data['delivery_date'] = row[col] if pd.notna(row[col]) else None
                
                # Generate load number if missing
                if not load_data.get('load_number'):
                    load_data['load_number'] = f"LOAD-{datetime.utcnow().strftime('%Y%m%d')}-{imported_count+1:04d}"
                
                # Check if load already exists
                existing = db.query(Load).filter(Load.load_number == load_data['load_number']).first()
                if existing:
                    skipped_count += 1
                    continue
                
                # Find or create customer
                customer = None
                if load_data.get('customer_name'):
                    customer = db.query(Customer).filter(Customer.company_name == load_data['customer_name']).first()
                
                # Build origin and destination strings
                origin = load_data.get('origin', '')
                if not origin and load_data.get('origin_city') and load_data.get('origin_state'):
                    origin = f"{load_data['origin_city']}, {load_data['origin_state']}"
                
                destination = load_data.get('destination', '')
                if not destination and load_data.get('destination_city') and load_data.get('destination_state'):
                    destination = f"{load_data['destination_city']}, {load_data['destination_state']}"
                
                # Create load
                load = Load(
                    carrier_id=1,
                    load_number=load_data['load_number'],
                    customer_id=customer.id if customer else None,
                    pickup_address=origin or 'Unknown',
                    delivery_address=destination or 'Unknown',
                    rate_amount=load_data.get('rate'),
                    total_miles=load_data.get('distance'),
                    status=load_data.get('status', 'Delivered'),
                    created_at=datetime.utcnow()
                )
                
                db.add(load)
                imported_count += 1
                
                if imported_count % 10 == 0:
                    print(f"  Imported {imported_count} loads...")
                    
            except Exception as e:
                print(f"  ❌ Error importing row {idx}: {e}")
                continue
        
        db.commit()
        print(f"✅ Successfully imported {imported_count} loads")
        print(f"⚠️  Skipped {skipped_count} rows (duplicates or invalid)")
        return imported_count
        
    except Exception as e:
        print(f"❌ Error reading loads file: {e}")
        db.rollback()
        return 0


def main():
    """Main import function."""
    print("=" * 60)
    print("🚀 MainTMS - Real Data Import Script")
    print("=" * 60)
    
    # Initialize database
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    
    SessionLocal = get_session_factory()
    db = SessionLocal()
    
    try:
        # Define file paths
        seed_data_dir = Path(__file__).parent.parent.parent / "seed_data"
        brokers_file = seed_data_dir / "brokers.xlsx"
        shippers_file = seed_data_dir / "shippers.xlsx"
        loads_file = seed_data_dir / "export_loads.xlsx"
        
        print(f"\n📂 Looking for data files in: {seed_data_dir}")
        
        total_imported = 0
        
        # Import brokers
        if brokers_file.exists():
            total_imported += import_brokers(db, str(brokers_file))
        else:
            print(f"⚠️  Brokers file not found: {brokers_file}")
        
        # Import shippers
        if shippers_file.exists():
            total_imported += import_shippers(db, str(shippers_file))
        else:
            print(f"⚠️  Shippers file not found: {shippers_file}")
        
        # Import loads
        if loads_file.exists():
            total_imported += import_loads(db, str(loads_file))
        else:
            print(f"⚠️  Loads file not found: {loads_file}")
        
        print("\n" + "=" * 60)
        print(f"✅ Import Complete! Total records imported: {total_imported}")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()

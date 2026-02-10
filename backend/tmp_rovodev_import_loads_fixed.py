"""
Import loads from Excel file into MainTMS database - FIXED VERSION
"""
import sys
sys.path.insert(0, '/app')

import pandas as pd
from app.core.database import get_db
from app.models import Load, Driver, Equipment, Customer
from datetime import datetime

def clean_value(val):
    """Clean NaN and empty values"""
    if pd.isna(val):
        return None
    val_str = str(val).strip()
    return val_str if val_str and val_str != 'nan' else None

def parse_date(date_str):
    """Parse date string to datetime"""
    if pd.isna(date_str) or not date_str:
        return None
    try:
        # Try MM/DD/YY format
        date_str = str(date_str).strip()
        for fmt in ['%m/%d/%y', '%m/%d/%Y', '%Y-%m-%d']:
            try:
                return datetime.strptime(date_str, fmt)
            except:
                continue
        return None
    except:
        return None

def import_loads():
    file_path = '/app/export_loads.xlsx'
    
    print("=" * 60)
    print("🚀 LOADS IMPORT - FIXED VERSION")
    print("=" * 60)
    
    print(f"\n📂 Reading: {file_path}")
    df = pd.read_excel(file_path)
    
    # Remove completely empty rows
    df = df.dropna(how='all')
    
    print(f"✅ Found {len(df)} rows with data")
    
    db = next(get_db())
    
    imported = 0
    skipped = 0
    errors = []
    
    try:
        for idx, row in df.iterrows():
            try:
                load_number = clean_value(row.get('Load #'))
                
                # Skip if no load number
                if not load_number:
                    skipped += 1
                    continue
                
                # Check if load already exists
                existing = db.query(Load).filter(
                    Load.load_number == load_number
                ).first()
                
                if existing:
                    skipped += 1
                    continue
                
                # Parse dates
                pickup_date = parse_date(row.get('Pickup Date'))
                completed_date = parse_date(row.get('Completed Date'))
                
                # Parse rate
                rate_val = row.get('Rate')
                rate = None
                if pd.notna(rate_val):
                    try:
                        rate = float(rate_val)
                    except:
                        pass
                
                # Parse status
                status_str = clean_value(row.get('Status'))
                if status_str:
                    status_map = {
                        'Delivered': 'delivered',
                        'In Transit': 'in_transit',
                        'Assigned': 'dispatched',
                        'Pending': 'new',
                        'Completed': 'completed'
                    }
                    status = status_map.get(status_str, status_str.lower())
                else:
                    status = 'completed' if completed_date else 'new'
                
                # Get broker name
                broker_name = clean_value(row.get('Broker'))
                
                # Try to find broker ID from customers
                broker_id = None
                if broker_name:
                    broker = db.query(Customer).filter(
                        Customer.company_name.ilike(f"%{broker_name}%")
                    ).first()
                    if broker:
                        broker_id = broker.id
                
                # Get driver name
                driver_name = clean_value(row.get('Driver'))
                driver_id = None
                if driver_name:
                    # Extract just the name (remove [Drv], [Own], etc)
                    driver_name_clean = driver_name.split('[')[0].strip()
                    driver = db.query(Driver).filter(
                        Driver.first_name.ilike(f"%{driver_name_clean.split()[0]}%")
                    ).first()
                    if driver:
                        driver_id = driver.id
                
                # Create load
                load = Load(
                    carrier_id=1,
                    load_number=load_number,
                    broker_id=broker_id,
                    broker_name=broker_name,
                    driver_id=driver_id,
                    pickup_location=clean_value(row.get('Pickup')),
                    delivery_location=clean_value(row.get('Delivery')),
                    pickup_date=pickup_date,
                    delivery_date=completed_date,
                    broker_rate=rate,
                    rate_amount=rate,
                    status=status,
                    po_number=clean_value(row.get('PO #')),
                    notes=clean_value(row.get('Notes')),
                    created_at=datetime.utcnow()
                )
                
                db.add(load)
                imported += 1
                
                if imported % 100 == 0:
                    print(f"✅ Imported {imported} loads...")
                    db.flush()  # Flush periodically
                
            except Exception as e:
                error_msg = f"Row {idx + 2} (Load {clean_value(row.get('Load #'))}): {str(e)}"
                errors.append(error_msg)
                print(f"❌ {error_msg}")
        
        # Commit all changes
        db.commit()
        print(f"\n🎉 Successfully committed {imported} loads to database!")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Fatal error, rolling back: {e}")
        raise
    finally:
        db.close()
    
    return {
        'imported': imported,
        'skipped': skipped,
        'errors': errors
    }

if __name__ == "__main__":
    result = import_loads()
    
    print("\n" + "=" * 60)
    print("📊 IMPORT SUMMARY")
    print("=" * 60)
    print(f"✅ Total Imported: {result['imported']}")
    print(f"⚠️  Total Skipped: {result['skipped']}")
    print(f"❌ Total Errors: {len(result['errors'])}")
    
    if result['errors']:
        print("\n🔍 Error Details (first 10):")
        for error in result['errors'][:10]:
            print(f"  - {error}")
    
    print("=" * 60)

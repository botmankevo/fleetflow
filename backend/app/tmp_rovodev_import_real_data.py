"""
Import real data from Excel files (trucks, trailers, drivers)
"""
import sys
import pandas as pd
from datetime import datetime
from app.core.database import get_session_factory, get_engine, Base
from app.models import Driver, Equipment, Payee, DriverPayProfile, DriverDocument
from app.core.security import get_password_hash

# Initialize database
engine = get_engine()
Base.metadata.create_all(bind=engine)
SessionLocal = get_session_factory()

def parse_date(date_str):
    """Parse date string to datetime object"""
    if pd.isna(date_str):
        return None
    if isinstance(date_str, datetime):
        return date_str
    try:
        # Try different formats
        for fmt in ['%m/%d/%y', '%m/%d/%Y', '%Y-%m-%d']:
            try:
                return datetime.strptime(str(date_str), fmt)
            except ValueError:
                continue
    except:
        pass
    return None

def import_trucks(db, filepath):
    """Import trucks from Excel"""
    print(f"\n📦 Importing trucks from {filepath}...")
    df = pd.read_excel(filepath)
    
    # Skip header row (first row with NaN)
    df = df[df['Name'].notna()]
    
    carrier_id = 1  # Cox Transport & Logistics
    imported = 0
    
    for idx, row in df.iterrows():
        try:
            unit_number = str(int(row['Unit'])) if pd.notna(row['Unit']) else str(row['Name'])
            
            # Check if already exists
            existing = db.query(Equipment).filter(
                Equipment.carrier_id == carrier_id,
                Equipment.equipment_type == 'truck',
                Equipment.identifier == unit_number
            ).first()
            
            if existing:
                print(f"  ⏭️  Truck {unit_number} already exists, skipping")
                continue
            
            truck = Equipment(
                carrier_id=carrier_id,
                equipment_type='truck',
                identifier=unit_number,
                status=row['Status'].lower() if pd.notna(row['Status']) else 'active'
            )
            db.add(truck)
            imported += 1
            print(f"  ✅ Imported truck {unit_number}")
            
        except Exception as e:
            print(f"  ❌ Error importing truck row {idx}: {e}")
            continue
    
    db.commit()
    print(f"\n✅ Imported {imported} trucks")
    return imported

def import_trailers(db, filepath):
    """Import trailers from Excel"""
    print(f"\n📦 Importing trailers from {filepath}...")
    df = pd.read_excel(filepath)
    
    # Skip header row
    df = df[df['Name'].notna()]
    
    carrier_id = 1
    imported = 0
    
    for idx, row in df.iterrows():
        try:
            unit_number = str(int(row['Unit'])) if pd.notna(row['Unit']) else str(row['Name'])
            
            # Check if already exists
            existing = db.query(Equipment).filter(
                Equipment.carrier_id == carrier_id,
                Equipment.equipment_type == 'trailer',
                Equipment.identifier == unit_number
            ).first()
            
            if existing:
                print(f"  ⏭️  Trailer {unit_number} already exists, skipping")
                continue
            
            trailer = Equipment(
                carrier_id=carrier_id,
                equipment_type='trailer',
                identifier=unit_number,
                status=row['Status'].lower() if pd.notna(row['Status']) else 'active'
            )
            db.add(trailer)
            imported += 1
            print(f"  ✅ Imported trailer {unit_number}")
            
        except Exception as e:
            print(f"  ❌ Error importing trailer row {idx}: {e}")
            continue
    
    db.commit()
    print(f"\n✅ Imported {imported} trailers")
    return imported

def import_drivers(db, filepath):
    """Import drivers from Excel"""
    print(f"\n👨‍✈️ Importing drivers from {filepath}...")
    df = pd.read_excel(filepath)
    
    # Skip header row
    df = df[df['First Name'].notna()]
    
    carrier_id = 1
    imported = 0
    
    for idx, row in df.iterrows():
        try:
            first_name = str(row['First Name']).strip()
            last_name = str(row['Last Name']).strip()
            full_name = f"{first_name} {last_name}"
            
            # Check if already exists
            existing = db.query(Driver).filter(
                Driver.carrier_id == carrier_id,
                Driver.name == full_name
            ).first()
            
            if existing:
                print(f"  ⏭️  Driver {full_name} already exists, skipping")
                continue
            
            # Create or get payee
            payee_name = str(row['Payable to']) if pd.notna(row['Payable to']) else full_name
            payee = db.query(Payee).filter(
                Payee.carrier_id == carrier_id,
                Payee.name == payee_name
            ).first()
            
            if not payee:
                driver_type = str(row['Type']).lower() if pd.notna(row['Type']) else 'drv'
                payee_type = 'owner_operator' if driver_type == 'own' else 'person'
                
                payee = Payee(
                    carrier_id=carrier_id,
                    name=payee_name,
                    payee_type=payee_type
                )
                db.add(payee)
                db.flush()
            
            # Create driver
            email = str(row['Email']).strip() if pd.notna(row['Email']) else None
            phone = str(row['Phone']).strip() if pd.notna(row['Phone']) else None
            
            driver = Driver(
                carrier_id=carrier_id,
                name=full_name,
                email=email,
                phone=phone,
                payee_id=payee.id
            )
            db.add(driver)
            db.flush()
            
            # Create pay profile
            driver_kind = 'owner_operator' if str(row['Type']).lower() == 'own' else 'company_driver'
            pay_profile = DriverPayProfile(
                driver_id=driver.id,
                pay_type='percent',
                rate=70.0 if driver_kind == 'owner_operator' else 30.0,
                driver_kind=driver_kind,
                active=True
            )
            db.add(pay_profile)
            
            # Add CDL document if available
            if pd.notna(row['CDL Number']):
                cdl_doc = DriverDocument(
                    driver_id=driver.id,
                    doc_type='cdl',
                    status='active',
                    issued_at=parse_date(row['CDL Issue Date']) if pd.notna(row['CDL Issue Date']) else None,
                    expires_at=parse_date(row['CDL Exp Date']) if pd.notna(row['CDL Exp Date']) else None
                )
                db.add(cdl_doc)
            
            # Add Medical Card document if available
            if pd.notna(row['Med Card Exp Date']):
                med_doc = DriverDocument(
                    driver_id=driver.id,
                    doc_type='medical_card',
                    status='active',
                    expires_at=parse_date(row['Med Card Exp Date'])
                )
                db.add(med_doc)
            
            imported += 1
            print(f"  ✅ Imported driver {full_name} ({driver_kind})")
            
        except Exception as e:
            print(f"  ❌ Error importing driver row {idx}: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    db.commit()
    print(f"\n✅ Imported {imported} drivers")
    return imported

def main():
    """Main import function"""
    print("🚀 Starting real data import...")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Import trucks
        trucks_count = import_trucks(db, r'C:\Users\my self\Downloads\trucks-20260206.xlsx')
        
        # Import trailers
        trailers_count = import_trailers(db, r'C:\Users\my self\Downloads\trailers-20260206.xlsx')
        
        # Import drivers
        drivers_count = import_drivers(db, r'C:\Users\my self\Downloads\drivers-20260206.xlsx')
        
        print("\n" + "=" * 60)
        print("✅ IMPORT COMPLETE!")
        print(f"   📦 Trucks: {trucks_count}")
        print(f"   📦 Trailers: {trailers_count}")
        print(f"   👨‍✈️ Drivers: {drivers_count}")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()

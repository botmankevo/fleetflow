"""
Import ALL broker and shipper files from Downloads folder
"""
import pandas as pd
from sqlalchemy import create_engine, text
from datetime import datetime
import os
import glob

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
engine = create_engine(DATABASE_URL)

def import_file(file_path, customer_type, carrier_id=1):
    """Import customers from a single Excel file"""
    print(f"\n📦 Importing {customer_type}s from {os.path.basename(file_path)}...")
    
    try:
        df = pd.read_excel(file_path)
        
        imported = 0
        skipped = 0
        
        with engine.connect() as conn:
            for idx, row in df.iterrows():
                # Extract company name
                company_name = None
                for col in ['Company', 'company', 'Name', 'name']:
                    if col in df.columns and pd.notna(row.get(col)):
                        company_name = str(row[col]).strip()
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
                mc_number = None
                contact_name = None
                address = None
                city = None
                state = None
                zip_code = None
                
                for col in df.columns:
                    col_lower = col.lower()
                    if 'email' in col_lower and 'billing' not in col_lower and pd.notna(row[col]):
                        email = str(row[col]).strip()
                    elif 'phone' in col_lower and pd.notna(row[col]):
                        phone = str(row[col]).strip()
                    elif 'mc' in col_lower and pd.notna(row[col]):
                        mc_number = str(row[col]).strip()
                    elif 'address' in col_lower and 'line 2' not in col_lower and pd.notna(row[col]):
                        address = str(row[col]).strip()
                    elif 'city' in col_lower and pd.notna(row[col]):
                        city = str(row[col]).strip()
                    elif 'state' in col_lower and pd.notna(row[col]):
                        state = str(row[col]).strip()
                    elif 'zip' in col_lower and pd.notna(row[col]):
                        zip_code = str(row[col]).strip()
                
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
                    "customer_type": customer_type,
                    "contact_name": contact_name,
                    "email": email,
                    "phone": phone,
                    "address": address,
                    "city": city,
                    "state": state,
                    "zip_code": zip_code,
                    "payment_terms": "Net 30",
                    "is_active": True,
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                })
                conn.commit()
                imported += 1
        
        print(f"  ✅ Imported {imported}, skipped {skipped} (duplicates)")
        return imported, skipped
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return 0, 0


def main():
    """Import all broker and shipper files"""
    print("=" * 70)
    print("🚀 MainTMS - COMPLETE Data Import (All Files)")
    print("=" * 70)
    
    downloads = r"C:\Users\my self\Downloads"
    
    total_imported = 0
    total_skipped = 0
    
    # Import all broker files
    print("\n📂 IMPORTING BROKERS:")
    print("-" * 70)
    broker_files = sorted(glob.glob(os.path.join(downloads, "brokers*.xlsx")))
    for file in broker_files:
        imported, skipped = import_file(file, "broker")
        total_imported += imported
        total_skipped += skipped
    
    # Import all shipper files
    print("\n📂 IMPORTING SHIPPERS:")
    print("-" * 70)
    shipper_files = sorted(glob.glob(os.path.join(downloads, "shippers*.xlsx")))
    for file in shipper_files:
        imported, skipped = import_file(file, "shipper")
        total_imported += imported
        total_skipped += skipped
    
    # Final summary
    print("\n" + "=" * 70)
    print("✅ IMPORT COMPLETE!")
    print("=" * 70)
    print(f"Total imported: {total_imported}")
    print(f"Total skipped: {total_skipped} (duplicates or invalid)")
    
    # Verify database
    with engine.connect() as conn:
        result = conn.execute(text("SELECT customer_type, COUNT(*) FROM customers GROUP BY customer_type"))
        print("\n📊 DATABASE TOTALS:")
        for row in result:
            print(f"  {row[0]}: {row[1]}")
        
        result = conn.execute(text("SELECT COUNT(*) FROM customers"))
        total = result.scalar()
        print(f"\n🎉 TOTAL CUSTOMERS IN DATABASE: {total}")


if __name__ == "__main__":
    main()

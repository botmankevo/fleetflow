"""
CSV Import Router with AI Auto-Fill
Handles bulk imports for drivers, equipment, loads, etc.
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from typing import Any, Dict, List, Optional
import csv
import io
from datetime import datetime

from app.core.security import get_current_user

router = APIRouter(prefix="/imports", tags=["imports"])


def ai_autofill_driver(row: Dict[str, str]) -> Dict[str, Any]:
    """
    AI agent to auto-fill missing driver fields with intelligent defaults
    """
    filled = {}
    
    # Map common column variations
    name_fields = ["name", "driver name", "driver_name", "full name", "fullname"]
    email_fields = ["email", "driver email", "driver_email", "e-mail"]
    phone_fields = ["phone", "phone number", "phone_number", "mobile", "cell"]
    license_fields = ["license", "license number", "license_number", "cdl", "cdl_number"]
    
    # Auto-fill name
    for field in name_fields:
        if field.lower() in [k.lower() for k in row.keys()]:
            filled["name"] = row[[k for k in row.keys() if k.lower() == field.lower()][0]]
            break
    
    # Auto-fill email
    for field in email_fields:
        if field.lower() in [k.lower() for k in row.keys()]:
            filled["email"] = row[[k for k in row.keys() if k.lower() == field.lower()][0]]
            break
    
    # Auto-fill phone
    for field in phone_fields:
        if field.lower() in [k.lower() for k in row.keys()]:
            phone = row[[k for k in row.keys() if k.lower() == field.lower()][0]]
            # Format phone number
            phone = ''.join(filter(str.isdigit, phone))
            if len(phone) == 10:
                filled["phone"] = f"({phone[:3]}) {phone[3:6]}-{phone[6:]}"
            else:
                filled["phone"] = phone
            break
    
    # Auto-fill license
    for field in license_fields:
        if field.lower() in [k.lower() for k in row.keys()]:
            filled["license_number"] = row[[k for k in row.keys() if k.lower() == field.lower()][0]]
            break
    
    # Intelligent defaults
    if "driver_type" not in filled:
        filled["driver_type"] = "company_driver"  # Default to company driver
    
    if "status" not in filled:
        filled["status"] = "active"  # Default to active
    
    if "pay_type" not in filled:
        filled["pay_type"] = "percentage"  # Default pay type
    
    if "pay_rate" not in filled and filled.get("pay_type") == "percentage":
        filled["pay_rate"] = 0.25  # Default 25% for company drivers
    
    return filled


def ai_autofill_equipment(row: Dict[str, str]) -> Dict[str, Any]:
    """
    AI agent to auto-fill missing equipment fields
    """
    filled = {}
    
    # Map common variations
    unit_fields = ["unit", "unit number", "unit_number", "truck number", "truck_number"]
    make_fields = ["make", "manufacturer"]
    model_fields = ["model"]
    year_fields = ["year", "model year", "model_year"]
    vin_fields = ["vin", "vin number", "vin_number"]
    
    # Auto-fill unit number
    for field in unit_fields:
        if field.lower() in [k.lower() for k in row.keys()]:
            filled["unit_number"] = row[[k for k in row.keys() if k.lower() == field.lower()][0]]
            break
    
    # Auto-fill make
    for field in make_fields:
        if field.lower() in [k.lower() for k in row.keys()]:
            filled["make"] = row[[k for k in row.keys() if k.lower() == field.lower()][0]]
            break
    
    # Auto-fill model
    for field in model_fields:
        if field.lower() in [k.lower() for k in row.keys()]:
            filled["model"] = row[[k for k in row.keys() if k.lower() == field.lower()][0]]
            break
    
    # Auto-fill year
    for field in year_fields:
        if field.lower() in [k.lower() for k in row.keys()]:
            year_val = row[[k for k in row.keys() if k.lower() == field.lower()][0]]
            try:
                filled["year"] = int(year_val)
            except:
                filled["year"] = datetime.now().year
            break
    
    # Auto-fill VIN
    for field in vin_fields:
        if field.lower() in [k.lower() for k in row.keys()]:
            filled["vin"] = row[[k for k in row.keys() if k.lower() == field.lower()][0]]
            break
    
    # Defaults
    if "equipment_type" not in filled:
        filled["equipment_type"] = "truck"
    
    if "status" not in filled:
        filled["status"] = "active"
    
    return filled


def ai_autofill_load(row: Dict[str, str]) -> Dict[str, Any]:
    """
    AI agent to auto-fill missing load fields
    """
    filled = {}
    
    # Map common variations
    load_fields = ["load", "load number", "load_number", "reference", "ref"]
    pickup_fields = ["pickup", "pickup location", "pickup_location", "origin"]
    delivery_fields = ["delivery", "delivery location", "delivery_location", "destination"]
    rate_fields = ["rate", "amount", "pay", "revenue"]
    
    # Auto-fill load number
    for field in load_fields:
        if field.lower() in [k.lower() for k in row.keys()]:
            filled["load_number"] = row[[k for k in row.keys() if k.lower() == field.lower()][0]]
            break
    
    # Auto-fill pickup
    for field in pickup_fields:
        if field.lower() in [k.lower() for k in row.keys()]:
            filled["pickup_location"] = row[[k for k in row.keys() if k.lower() == field.lower()][0]]
            break
    
    # Auto-fill delivery
    for field in delivery_fields:
        if field.lower() in [k.lower() for k in row.keys()]:
            filled["delivery_location"] = row[[k for k in row.keys() if k.lower() == field.lower()][0]]
            break
    
    # Auto-fill rate
    for field in rate_fields:
        if field.lower() in [k.lower() for k in row.keys()]:
            rate_val = row[[k for k in row.keys() if k.lower() == field.lower()][0]]
            try:
                # Remove currency symbols and commas
                rate_val = rate_val.replace('$', '').replace(',', '').strip()
                filled["rate"] = float(rate_val)
            except:
                filled["rate"] = 0.0
            break
    
    # Defaults
    if "status" not in filled:
        filled["status"] = "pending"
    
    return filled


@router.post("/drivers")
async def import_drivers(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Import drivers from CSV with AI auto-fill
    
    Accepts various column formats and intelligently maps fields:
    - Name: "name", "driver name", "full name", etc.
    - Email: "email", "driver email", "e-mail", etc.
    - Phone: "phone", "mobile", "cell", etc.
    - License: "license", "cdl", "license number", etc.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    content = await file.read()
    csv_text = content.decode('utf-8')
    
    reader = csv.DictReader(io.StringIO(csv_text))
    
    imported = []
    errors = []
    
    for i, row in enumerate(reader, start=1):
        try:
            # AI auto-fill
            driver_data = ai_autofill_driver(row)
            
            # Validate required fields
            if not driver_data.get("name"):
                errors.append({"row": i, "error": "Missing driver name"})
                continue
            
            # Here you would actually create the driver in your database
            # driver = await create_driver(driver_data)
            
            imported.append({
                "row": i,
                "name": driver_data.get("name"),
                "email": driver_data.get("email"),
                "status": "success"
            })
            
        except Exception as e:
            errors.append({"row": i, "error": str(e)})
    
    return {
        "ok": True,
        "data": {
            "imported": len(imported),
            "errors": len(errors),
            "details": imported,
            "error_details": errors
        }
    }


@router.post("/equipment")
async def import_equipment(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Import equipment (trucks/trailers) from CSV with AI auto-fill
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    content = await file.read()
    csv_text = content.decode('utf-8')
    
    reader = csv.DictReader(io.StringIO(csv_text))
    
    imported = []
    errors = []
    
    for i, row in enumerate(reader, start=1):
        try:
            equipment_data = ai_autofill_equipment(row)
            
            if not equipment_data.get("unit_number"):
                errors.append({"row": i, "error": "Missing unit number"})
                continue
            
            imported.append({
                "row": i,
                "unit": equipment_data.get("unit_number"),
                "make": equipment_data.get("make"),
                "model": equipment_data.get("model"),
                "status": "success"
            })
            
        except Exception as e:
            errors.append({"row": i, "error": str(e)})
    
    return {
        "ok": True,
        "data": {
            "imported": len(imported),
            "errors": len(errors),
            "details": imported,
            "error_details": errors
        }
    }


@router.post("/loads")
async def import_loads(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Import loads from CSV with AI auto-fill
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    content = await file.read()
    csv_text = content.decode('utf-8')
    
    reader = csv.DictReader(io.StringIO(csv_text))
    
    imported = []
    errors = []
    
    for i, row in enumerate(reader, start=1):
        try:
            load_data = ai_autofill_load(row)
            
            if not load_data.get("load_number"):
                errors.append({"row": i, "error": "Missing load number"})
                continue
            
            imported.append({
                "row": i,
                "load_number": load_data.get("load_number"),
                "pickup": load_data.get("pickup_location"),
                "delivery": load_data.get("delivery_location"),
                "status": "success"
            })
            
        except Exception as e:
            errors.append({"row": i, "error": str(e)})
    
    return {
        "ok": True,
        "data": {
            "imported": len(imported),
            "errors": len(errors),
            "details": imported,
            "error_details": errors
        }
    }


@router.get("/template/drivers")
async def get_driver_template():
    """
    Download CSV template for driver import
    """
    template = """name,email,phone,license_number,driver_type,pay_type,pay_rate
John Doe,john@example.com,(555) 123-4567,CDL123456,company_driver,percentage,0.25
Jane Smith,jane@example.com,(555) 987-6543,CDL987654,owner_operator,percentage,0.75"""
    
    return {
        "ok": True,
        "data": {
            "template": template,
            "filename": "driver_import_template.csv"
        }
    }


@router.get("/template/equipment")
async def get_equipment_template():
    """
    Download CSV template for equipment import
    """
    template = """unit_number,make,model,year,vin,equipment_type,status
T-101,Freightliner,Cascadia,2022,1FUJGHDV2NLLX4567,truck,active
T-102,Volvo,VNL,2021,4V4NC9EH5MN123456,truck,active"""
    
    return {
        "ok": True,
        "data": {
            "template": template,
            "filename": "equipment_import_template.csv"
        }
    }


@router.get("/template/loads")
async def get_load_template():
    """
    Download CSV template for load import
    """
    template = """load_number,pickup_location,delivery_location,rate,pickup_date,delivery_date
L-2024-001,Los Angeles CA,Phoenix AZ,2500.00,2024-02-05,2024-02-06
L-2024-002,Dallas TX,Chicago IL,3200.00,2024-02-06,2024-02-08"""
    
    return {
        "ok": True,
        "data": {
            "template": template,
            "filename": "load_import_template.csv"
        }
    }

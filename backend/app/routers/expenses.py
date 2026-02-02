from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from sqlalchemy.orm import Session
from app.core.security import verify_token
from app.core.database import get_db
from app.core.config import settings
from app.services.dropbox import DropboxService
from app.schemas.expenses import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app import models

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("", response_model=list[ExpenseResponse])
def list_expenses(token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    query = db.query(models.Expense).filter(models.Expense.carrier_id == carrier_id)
    if token.get("role") == "driver":
        if not token.get("driver_id"):
            return []
        query = query.filter(models.Expense.driver_id == token.get("driver_id"))
    return query.all()


@router.post("", response_model=ExpenseResponse)
def create_expense(payload: ExpenseCreate, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    driver_id = payload.driver_id
    if token.get("role") == "driver":
        if not token.get("driver_id"):
            raise HTTPException(status_code=400, detail="Missing driver_id")
        driver_id = token.get("driver_id")

    record = models.Expense(
        carrier_id=carrier_id,
        driver_id=driver_id,
        amount=payload.amount,
        category=payload.category,
        description=payload.description,
        occurred_at=payload.occurred_at,
        receipt_link=payload.receipt_link,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.patch("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, payload: ExpenseUpdate, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    record = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.carrier_id == carrier_id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Expense not found")
    if token.get("role") == "driver" and token.get("driver_id") and record.driver_id != token.get("driver_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    if token.get("role") == "driver" and token.get("driver_id") and record.driver_id != token.get("driver_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.post("/{expense_id}/receipt")
def upload_receipt(expense_id: int, file: UploadFile = File(...), token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    record = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.carrier_id == carrier_id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Expense not found")
    dropbox = DropboxService()
    base_path = f"{settings.DROPBOX_ROOT_FOLDER}/{carrier_id}/expenses/{expense_id}"
    dropbox.upload_file(file.file.read(), f"{base_path}/{file.filename}")
    link = dropbox.create_shared_link(f"{base_path}/{file.filename}")
    record.receipt_link = link
    db.commit()
    return {"link": link}

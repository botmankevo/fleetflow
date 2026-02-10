"""
Accounting and Financial Reporting API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case
from typing import List, Optional
from datetime import datetime, timedelta, date
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Load, User
from app.routers.customers import Customer
from app.routers.invoices import Invoice

router = APIRouter(prefix="/accounting", tags=["accounting"])


class ReceivablesReport(BaseModel):
    """Accounts Receivable Aging Report"""
    customer_id: int
    customer_name: str
    current: float  # 0-30 days
    days_30_60: float
    days_60_90: float
    over_90: float
    total_outstanding: float


class PayablesReport(BaseModel):
    """Accounts Payable Report"""
    driver_id: Optional[int]
    driver_name: str
    amount_owed: float
    oldest_date: Optional[date]
    payment_status: str


class ProfitLossReport(BaseModel):
    """Profit & Loss Statement"""
    period_start: date
    period_end: date
    total_revenue: float
    total_expenses: float
    gross_profit: float
    net_profit: float
    profit_margin: float


class RevenueByCustomer(BaseModel):
    """Revenue breakdown by customer"""
    customer_id: int
    customer_name: str
    total_revenue: float
    load_count: int
    avg_revenue_per_load: float


@router.get("/receivables", response_model=List[ReceivablesReport])
def get_accounts_receivable(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get accounts receivable aging report
    Shows how much each customer owes, broken down by aging buckets
    """
    carrier_id = current_user.carrier_id
    today = datetime.now().date()
    
    # Get all unpaid invoices
    invoices = db.query(Invoice).filter(
        and_(
            Invoice.carrier_id == carrier_id,
            Invoice.status != "paid",
            Invoice.balance_due > 0
        )
    ).all()
    
    # Group by customer
    customer_balances = {}
    
    for invoice in invoices:
        customer_id = invoice.customer_id
        
        if customer_id not in customer_balances:
            customer = db.query(Customer).filter(Customer.id == customer_id).first()
            customer_balances[customer_id] = {
                "customer_id": customer_id,
                "customer_name": customer.name if customer else "Unknown",
                "current": 0.0,
                "days_30_60": 0.0,
                "days_60_90": 0.0,
                "over_90": 0.0,
                "total_outstanding": 0.0
            }
        
        # Calculate days overdue
        days_overdue = (today - invoice.due_date).days
        balance = invoice.balance_due
        
        if days_overdue <= 30:
            customer_balances[customer_id]["current"] += balance
        elif days_overdue <= 60:
            customer_balances[customer_id]["days_30_60"] += balance
        elif days_overdue <= 90:
            customer_balances[customer_id]["days_60_90"] += balance
        else:
            customer_balances[customer_id]["over_90"] += balance
        
        customer_balances[customer_id]["total_outstanding"] += balance
    
    # Convert to list and sort by total outstanding
    result = sorted(
        customer_balances.values(),
        key=lambda x: x["total_outstanding"],
        reverse=True
    )
    
    return result


@router.get("/payables", response_model=List[PayablesReport])
def get_accounts_payable(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get accounts payable report
    Shows how much you owe to drivers and owner-operators
    """
    carrier_id = current_user.carrier_id
    
    # Query loads that have been delivered but not fully paid to driver
    from app.models import Driver
    
    drivers_owed = db.query(
        Driver.id,
        Driver.first_name,
        Driver.last_name,
        func.sum(Load.rate).label("total_owed")
    ).join(
        Load, Load.driver_id == Driver.id
    ).filter(
        and_(
            Load.carrier_id == carrier_id,
            Load.status == "delivered",
            # TODO: Add payment_status field to loads
            # For now, assume unpaid if delivered recently
        )
    ).group_by(Driver.id, Driver.first_name, Driver.last_name).all()
    
    result = []
    for driver_id, first_name, last_name, total_owed in drivers_owed:
        result.append({
            "driver_id": driver_id,
            "driver_name": f"{first_name} {last_name}",
            "amount_owed": total_owed or 0.0,
            "oldest_date": None,  # TODO: Get oldest unpaid load date
            "payment_status": "pending"
        })
    
    return result


@router.get("/profit-loss", response_model=ProfitLossReport)
def get_profit_loss(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate Profit & Loss statement for a date range
    """
    carrier_id = current_user.carrier_id
    
    # Parse dates
    period_start = datetime.strptime(start_date, "%Y-%m-%d").date()
    period_end = datetime.strptime(end_date, "%Y-%m-%d").date()
    
    # Calculate total revenue from loads
    revenue_query = db.query(
        func.sum(Load.rate)
    ).filter(
        and_(
            Load.carrier_id == carrier_id,
            Load.delivery_date >= period_start,
            Load.delivery_date <= period_end,
            Load.status == "delivered"
        )
    ).scalar()
    
    total_revenue = revenue_query or 0.0
    
    # Calculate expenses
    from app.models import Expense
    
    expenses_query = db.query(
        func.sum(Expense.amount)
    ).filter(
        and_(
            Expense.carrier_id == carrier_id,
            Expense.expense_date >= period_start,
            Expense.expense_date <= period_end
        )
    ).scalar()
    
    total_expenses = expenses_query or 0.0
    
    # Calculate profits
    gross_profit = total_revenue - total_expenses
    net_profit = gross_profit  # TODO: Subtract overhead, taxes, etc.
    profit_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0.0
    
    return {
        "period_start": period_start,
        "period_end": period_end,
        "total_revenue": total_revenue,
        "total_expenses": total_expenses,
        "gross_profit": gross_profit,
        "net_profit": net_profit,
        "profit_margin": profit_margin
    }


@router.get("/revenue-by-customer", response_model=List[RevenueByCustomer])
def get_revenue_by_customer(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get revenue breakdown by customer
    """
    carrier_id = current_user.carrier_id
    
    # Build query
    query = db.query(
        Customer.id,
        Customer.name,
        func.sum(Load.rate).label("total_revenue"),
        func.count(Load.id).label("load_count")
    ).join(
        Load, Load.customer_id == Customer.id
    ).filter(
        and_(
            Load.carrier_id == carrier_id,
            Load.status == "delivered"
        )
    )
    
    # Apply date filters if provided
    if start_date:
        period_start = datetime.strptime(start_date, "%Y-%m-%d").date()
        query = query.filter(Load.delivery_date >= period_start)
    
    if end_date:
        period_end = datetime.strptime(end_date, "%Y-%m-%d").date()
        query = query.filter(Load.delivery_date <= period_end)
    
    # Group and order
    results = query.group_by(
        Customer.id, Customer.name
    ).order_by(
        func.sum(Load.rate).desc()
    ).all()
    
    # Format response
    revenue_data = []
    for customer_id, customer_name, total_revenue, load_count in results:
        revenue_data.append({
            "customer_id": customer_id,
            "customer_name": customer_name,
            "total_revenue": total_revenue or 0.0,
            "load_count": load_count or 0,
            "avg_revenue_per_load": (total_revenue / load_count) if load_count > 0 else 0.0
        })
    
    return revenue_data


@router.get("/cash-flow")
def get_cash_flow(
    months: int = Query(6, description="Number of months to analyze"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get cash flow analysis (monthly revenue vs expenses)
    """
    carrier_id = current_user.carrier_id
    today = datetime.now().date()
    start_date = today - timedelta(days=months * 30)
    
    # Get monthly revenue
    monthly_data = []
    
    for i in range(months):
        month_start = today - timedelta(days=(months - i) * 30)
        month_end = today - timedelta(days=(months - i - 1) * 30)
        
        # Revenue
        revenue = db.query(
            func.sum(Load.rate)
        ).filter(
            and_(
                Load.carrier_id == carrier_id,
                Load.delivery_date >= month_start,
                Load.delivery_date < month_end,
                Load.status == "delivered"
            )
        ).scalar() or 0.0
        
        # Expenses
        from app.models import Expense
        expenses = db.query(
            func.sum(Expense.amount)
        ).filter(
            and_(
                Expense.carrier_id == carrier_id,
                Expense.expense_date >= month_start,
                Expense.expense_date < month_end
            )
        ).scalar() or 0.0
        
        monthly_data.append({
            "month": month_start.strftime("%Y-%m"),
            "revenue": revenue,
            "expenses": expenses,
            "net_cash_flow": revenue - expenses
        })
    
    return {
        "months": monthly_data,
        "summary": {
            "total_revenue": sum(m["revenue"] for m in monthly_data),
            "total_expenses": sum(m["expenses"] for m in monthly_data),
            "net_cash_flow": sum(m["net_cash_flow"] for m in monthly_data)
        }
    }


@router.get("/ifta-report")
def get_ifta_report(
    quarter: int = Query(..., description="Quarter (1-4)"),
    year: int = Query(..., description="Year (e.g., 2026)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate IFTA (International Fuel Tax Agreement) report
    Shows miles driven and fuel consumed by state
    """
    carrier_id = current_user.carrier_id
    
    # Calculate quarter date range
    quarter_months = {
        1: (1, 3),
        2: (4, 6),
        3: (7, 9),
        4: (10, 12)
    }
    
    start_month, end_month = quarter_months.get(quarter, (1, 3))
    start_date = date(year, start_month, 1)
    
    # End date is last day of end_month
    if end_month == 12:
        end_date = date(year, 12, 31)
    else:
        end_date = date(year, end_month + 1, 1) - timedelta(days=1)
    
    # TODO: This requires detailed state-by-state mileage tracking
    # For now, return placeholder structure
    
    return {
        "quarter": quarter,
        "year": year,
        "period_start": start_date.isoformat(),
        "period_end": end_date.isoformat(),
        "states": [
            # Example structure - needs real data from loads/GPS tracking
            {
                "state": "TX",
                "miles_driven": 0,
                "fuel_purchased_gallons": 0,
                "fuel_tax_rate": 0.20,
                "tax_owed": 0.0
            }
        ],
        "total_miles": 0,
        "total_fuel_gallons": 0,
        "total_tax_owed": 0.0,
        "note": "Detailed IFTA reporting requires GPS/ELD integration for state-by-state mileage tracking"
    }

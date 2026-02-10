"""
Payroll reporting service for generating various payroll analytics and reports.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from typing import Dict, List, Any
from app import models


class PayrollReports:
    """Generate various payroll reports and analytics."""
    
    @staticmethod
    def generate_payroll_summary(db: Session, carrier_id: int, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """
        Generate comprehensive payroll summary for a date range.
        
        Returns:
            - Total paid
            - Settlement count
            - Driver count
            - Average pay per driver
            - Breakdown by category
        """
        # Get all settlements in date range
        settlements = (
            db.query(models.PayrollSettlement)
            .join(models.Payee)
            .filter(
                models.Payee.carrier_id == carrier_id,
                models.PayrollSettlement.period_start >= start_date,
                models.PayrollSettlement.period_end <= end_date
            )
            .all()
        )
        
        # Get all lines for these settlements
        settlement_ids = [s.id for s in settlements]
        lines = (
            db.query(models.SettlementLedgerLine)
            .filter(models.SettlementLedgerLine.settlement_id.in_(settlement_ids))
            .all()
        ) if settlement_ids else []
        
        # Calculate totals
        total_paid = sum(float(line.amount) for line in lines)
        
        # Category breakdown
        category_totals = {}
        for line in lines:
            cat = line.category or "uncategorized"
            if cat not in category_totals:
                category_totals[cat] = 0
            category_totals[cat] += float(line.amount)
        
        # Driver count (unique payees)
        unique_payees = set(s.payee_id for s in settlements)
        driver_count = len(unique_payees)
        
        # Average per driver
        avg_per_driver = total_paid / driver_count if driver_count > 0 else 0
        
        # Status breakdown
        status_breakdown = {}
        for s in settlements:
            if s.status not in status_breakdown:
                status_breakdown[s.status] = {"count": 0, "total": 0}
            status_breakdown[s.status]["count"] += 1
            # Calculate settlement total
            s_lines = [l for l in lines if l.settlement_id == s.id]
            status_breakdown[s.status]["total"] += sum(float(l.amount) for l in s_lines)
        
        return {
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "summary": {
                "total_paid": total_paid,
                "settlement_count": len(settlements),
                "driver_count": driver_count,
                "average_per_driver": avg_per_driver,
                "total_line_items": len(lines)
            },
            "category_breakdown": category_totals,
            "status_breakdown": status_breakdown
        }
    
    @staticmethod
    def generate_driver_pay_history(db: Session, driver_id: int, start_date: datetime = None, end_date: datetime = None) -> Dict[str, Any]:
        """
        Generate pay history report for a specific driver.
        
        Returns settlements, line items, and totals for the driver.
        """
        # Get driver and payee
        driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
        if not driver:
            return {"error": "Driver not found"}
        
        # Query settlements
        query = db.query(models.PayrollSettlement).filter(
            models.PayrollSettlement.payee_id == driver.payee_id
        )
        
        if start_date:
            query = query.filter(models.PayrollSettlement.period_start >= start_date)
        if end_date:
            query = query.filter(models.PayrollSettlement.period_end <= end_date)
        
        settlements = query.order_by(models.PayrollSettlement.period_start.desc()).all()
        
        # Build detailed history
        history = []
        total_earned = 0
        
        for settlement in settlements:
            lines = (
                db.query(models.SettlementLedgerLine)
                .filter(models.SettlementLedgerLine.settlement_id == settlement.id)
                .all()
            )
            
            settlement_total = sum(float(line.amount) for line in lines)
            total_earned += settlement_total if settlement.status == "paid" else 0
            
            line_details = []
            for line in lines:
                load_info = None
                if line.load_id:
                    load = db.query(models.Load).filter(models.Load.id == line.load_id).first()
                    if load:
                        load_info = {
                            "load_number": load.load_number,
                            "pickup_location": load.pickup_location,
                            "delivery_location": load.delivery_location
                        }
                
                line_details.append({
                    "id": line.id,
                    "category": line.category,
                    "description": line.description,
                    "amount": float(line.amount),
                    "load_info": load_info,
                    "locked": line.locked_at is not None,
                    "created_at": line.created_at.isoformat() if line.created_at else None
                })
            
            history.append({
                "settlement_id": settlement.id,
                "period_start": settlement.period_start.isoformat(),
                "period_end": settlement.period_end.isoformat(),
                "status": settlement.status,
                "paid_at": settlement.paid_at.isoformat() if settlement.paid_at else None,
                "total": settlement_total,
                "line_count": len(lines),
                "lines": line_details
            })
        
        return {
            "driver": {
                "id": driver.id,
                "name": driver.name,
                "payee_id": driver.payee_id
            },
            "summary": {
                "total_earned": total_earned,
                "settlement_count": len(settlements),
                "paid_settlements": len([s for s in settlements if s.status == "paid"]),
                "pending_amount": sum(float(line.amount) for s in settlements if s.status != "paid" for line in db.query(models.SettlementLedgerLine).filter(models.SettlementLedgerLine.settlement_id == s.id).all())
            },
            "history": history
        }
    
    @staticmethod
    def generate_variance_report(db: Session, carrier_id: int, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """
        Generate variance report showing adjustments and corrections.
        
        Shows all adjustment lines created during the period, grouped by reason.
        """
        # Get all payees for this carrier
        payees = db.query(models.Payee).filter(models.Payee.carrier_id == carrier_id).all()
        payee_ids = [p.id for p in payees]
        
        # Get adjustment lines
        adjustments = (
            db.query(models.SettlementLedgerLine)
            .filter(
                models.SettlementLedgerLine.payee_id.in_(payee_ids),
                models.SettlementLedgerLine.category == "adjustment",
                models.SettlementLedgerLine.created_at >= start_date,
                models.SettlementLedgerLine.created_at <= end_date
            )
            .all()
        )
        
        # Group by type (positive vs negative)
        increases = [a for a in adjustments if a.amount > 0]
        decreases = [a for a in adjustments if a.amount < 0]
        
        # Build detail list
        adjustment_details = []
        for adj in adjustments:
            payee = db.query(models.Payee).filter(models.Payee.id == adj.payee_id).first()
            load = None
            if adj.load_id:
                load = db.query(models.Load).filter(models.Load.id == adj.load_id).first()
            
            adjustment_details.append({
                "id": adj.id,
                "payee_name": payee.name if payee else None,
                "load_number": load.load_number if load else None,
                "amount": float(adj.amount),
                "description": adj.description,
                "created_at": adj.created_at.isoformat() if adj.created_at else None,
                "replaces_line_id": adj.replaces_line_id
            })
        
        return {
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "summary": {
                "total_adjustments": len(adjustments),
                "increases_count": len(increases),
                "decreases_count": len(decreases),
                "total_increase_amount": sum(float(a.amount) for a in increases),
                "total_decrease_amount": sum(abs(float(a.amount)) for a in decreases),
                "net_adjustment": sum(float(a.amount) for a in adjustments)
            },
            "adjustments": adjustment_details
        }
    
    @staticmethod
    def generate_recurring_items_report(db: Session, carrier_id: int) -> Dict[str, Any]:
        """
        Generate report of all active recurring items (deductions, additions).
        
        Shows which drivers have recurring items and when they're due.
        """
        # Get all drivers for this carrier
        drivers = db.query(models.Driver).filter(models.Driver.carrier_id == carrier_id).all()
        driver_ids = [d.id for d in drivers]
        
        # Get all active recurring items
        recurring_items = (
            db.query(models.RecurringSettlementItem)
            .filter(
                models.RecurringSettlementItem.driver_id.in_(driver_ids),
                models.RecurringSettlementItem.active == True
            )
            .all()
        )
        
        # Group by type
        by_type = {}
        total_monthly_impact = 0
        
        for item in recurring_items:
            item_type = item.item_type or "other"
            if item_type not in by_type:
                by_type[item_type] = []
            
            driver = db.query(models.Driver).filter(models.Driver.id == item.driver_id).first()
            payee = db.query(models.Payee).filter(models.Payee.id == item.payee_id).first()
            
            # Calculate monthly impact based on schedule
            monthly_impact = float(item.amount)
            if item.schedule == "weekly":
                monthly_impact *= 4.33  # Average weeks per month
            elif item.schedule == "biweekly":
                monthly_impact *= 2.17  # Average biweekly periods per month
            
            # Adjust sign for deductions
            if item_type in ["deduction", "loan"]:
                monthly_impact = -abs(monthly_impact)
            
            total_monthly_impact += monthly_impact
            
            by_type[item_type].append({
                "id": item.id,
                "driver_name": driver.name if driver else None,
                "payee_name": payee.name if payee else None,
                "amount": float(item.amount),
                "schedule": item.schedule,
                "description": item.description,
                "next_date": item.next_date.isoformat() if item.next_date else None,
                "monthly_impact": monthly_impact
            })
        
        return {
            "summary": {
                "total_active_items": len(recurring_items),
                "estimated_monthly_impact": total_monthly_impact
            },
            "by_type": by_type
        }
    
    @staticmethod
    def generate_pending_payables_summary(db: Session, carrier_id: int) -> Dict[str, Any]:
        """
        Generate summary of all pending (unpaid) payables.
        
        Shows what's owed to each driver/payee that hasn't been settled yet.
        """
        # Get all payees for carrier
        payees = db.query(models.Payee).filter(models.Payee.carrier_id == carrier_id).all()
        payee_ids = [p.id for p in payees]
        
        # Get pending lines
        pending_lines = (
            db.query(models.SettlementLedgerLine)
            .filter(
                models.SettlementLedgerLine.payee_id.in_(payee_ids),
                models.SettlementLedgerLine.settlement_id.is_(None),
                models.SettlementLedgerLine.locked_at.is_(None),
                models.SettlementLedgerLine.voided_at.is_(None)
            )
            .all()
        )
        
        # Group by payee
        by_payee = {}
        total_pending = 0
        
        for line in pending_lines:
            if line.payee_id not in by_payee:
                payee = db.query(models.Payee).filter(models.Payee.id == line.payee_id).first()
                by_payee[line.payee_id] = {
                    "payee_name": payee.name if payee else None,
                    "payee_type": payee.payee_type if payee else None,
                    "lines": [],
                    "total": 0
                }
            
            by_payee[line.payee_id]["lines"].append({
                "id": line.id,
                "category": line.category,
                "description": line.description,
                "amount": float(line.amount),
                "created_at": line.created_at.isoformat() if line.created_at else None
            })
            by_payee[line.payee_id]["total"] += float(line.amount)
            total_pending += float(line.amount)
        
        return {
            "summary": {
                "total_pending": total_pending,
                "payee_count": len(by_payee),
                "line_count": len(pending_lines)
            },
            "by_payee": list(by_payee.values())
        }


# Singleton instance
payroll_reports = PayrollReports()

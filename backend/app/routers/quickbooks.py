"""
QuickBooks Integration API endpoints
OAuth 2.0 authentication and data synchronization
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import os
import json
import requests
from urllib.parse import urlencode

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User
from app.routers.customers import Customer
from app.routers.invoices import Invoice

router = APIRouter(prefix="/quickbooks", tags=["quickbooks"])

# QuickBooks OAuth 2.0 Configuration
QB_CLIENT_ID = os.getenv("QUICKBOOKS_CLIENT_ID", "")
QB_CLIENT_SECRET = os.getenv("QUICKBOOKS_CLIENT_SECRET", "")
QB_REDIRECT_URI = os.getenv("QUICKBOOKS_REDIRECT_URI", "http://localhost:3000/quickbooks/callback")
QB_ENVIRONMENT = os.getenv("QUICKBOOKS_ENVIRONMENT", "sandbox")  # sandbox or production

# QuickBooks API URLs
QB_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2"
QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
QB_REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke"

if QB_ENVIRONMENT == "sandbox":
    QB_API_BASE_URL = "https://sandbox-quickbooks.api.intuit.com"
else:
    QB_API_BASE_URL = "https://quickbooks.api.intuit.com"


# Database model for QuickBooks tokens (add to models.py)
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.core.database import Base


class QuickBooksToken(Base):
    """Store QuickBooks OAuth tokens"""
    __tablename__ = "quickbooks_tokens"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    realm_id = Column(String(50), nullable=False)  # QuickBooks Company ID
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=False)
    token_type = Column(String(20), default="Bearer")
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


@router.get("/auth")
def initiate_oauth(
    current_user: User = Depends(get_current_user)
):
    """
    Initiate QuickBooks OAuth 2.0 flow
    Redirects user to QuickBooks login
    """
    if not QB_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="QuickBooks Client ID not configured. Please set QUICKBOOKS_CLIENT_ID environment variable."
        )
    
    # Build authorization URL
    params = {
        "client_id": QB_CLIENT_ID,
        "response_type": "code",
        "scope": "com.intuit.quickbooks.accounting",
        "redirect_uri": QB_REDIRECT_URI,
        "state": f"carrier_{current_user.carrier_id}"  # Pass carrier_id in state
    }
    
    auth_url = f"{QB_AUTH_URL}?{urlencode(params)}"
    
    return {
        "authorization_url": auth_url,
        "message": "Redirect user to this URL to authorize QuickBooks access"
    }


@router.get("/callback")
def oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    realmId: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Handle QuickBooks OAuth callback
    Exchange authorization code for access token
    """
    if not QB_CLIENT_ID or not QB_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="QuickBooks credentials not configured"
        )
    
    # Extract carrier_id from state
    try:
        carrier_id = int(state.split("_")[1])
    except:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    # Exchange code for tokens
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": QB_REDIRECT_URI
    }
    
    try:
        response = requests.post(
            QB_TOKEN_URL,
            auth=(QB_CLIENT_ID, QB_CLIENT_SECRET),
            data=token_data,
            headers={"Accept": "application/json"}
        )
        response.raise_for_status()
        tokens = response.json()
        
        # Calculate token expiration
        expires_in = tokens.get("expires_in", 3600)
        expires_at = datetime.utcnow().timestamp() + expires_in
        
        # Store tokens in database
        existing_token = db.query(QuickBooksToken).filter(
            QuickBooksToken.carrier_id == carrier_id
        ).first()
        
        if existing_token:
            # Update existing token
            existing_token.realm_id = realmId
            existing_token.access_token = tokens["access_token"]
            existing_token.refresh_token = tokens["refresh_token"]
            existing_token.expires_at = datetime.fromtimestamp(expires_at)
            existing_token.updated_at = datetime.utcnow()
        else:
            # Create new token record
            new_token = QuickBooksToken(
                carrier_id=carrier_id,
                realm_id=realmId,
                access_token=tokens["access_token"],
                refresh_token=tokens["refresh_token"],
                expires_at=datetime.fromtimestamp(expires_at)
            )
            db.add(new_token)
        
        db.commit()
        
        return {
            "success": True,
            "message": "QuickBooks connected successfully",
            "realm_id": realmId
        }
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to exchange authorization code: {str(e)}"
        )


@router.post("/refresh-token")
def refresh_access_token(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Refresh QuickBooks access token using refresh token
    """
    carrier_id = current_user.carrier_id
    
    # Get stored token
    token_record = db.query(QuickBooksToken).filter(
        QuickBooksToken.carrier_id == carrier_id
    ).first()
    
    if not token_record:
        raise HTTPException(status_code=404, detail="QuickBooks not connected")
    
    # Refresh token
    token_data = {
        "grant_type": "refresh_token",
        "refresh_token": token_record.refresh_token
    }
    
    try:
        response = requests.post(
            QB_TOKEN_URL,
            auth=(QB_CLIENT_ID, QB_CLIENT_SECRET),
            data=token_data,
            headers={"Accept": "application/json"}
        )
        response.raise_for_status()
        tokens = response.json()
        
        # Update tokens
        expires_in = tokens.get("expires_in", 3600)
        expires_at = datetime.utcnow().timestamp() + expires_in
        
        token_record.access_token = tokens["access_token"]
        token_record.refresh_token = tokens["refresh_token"]
        token_record.expires_at = datetime.fromtimestamp(expires_at)
        token_record.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "success": True,
            "message": "Token refreshed successfully"
        }
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to refresh token: {str(e)}"
        )


@router.get("/status")
def get_connection_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check QuickBooks connection status
    """
    carrier_id = current_user.carrier_id
    
    token_record = db.query(QuickBooksToken).filter(
        QuickBooksToken.carrier_id == carrier_id
    ).first()
    
    if not token_record:
        return {
            "connected": False,
            "message": "QuickBooks not connected"
        }
    
    # Check if token is expired
    is_expired = token_record.expires_at < datetime.utcnow()
    
    return {
        "connected": True,
        "realm_id": token_record.realm_id,
        "token_expires_at": token_record.expires_at.isoformat(),
        "is_expired": is_expired,
        "connected_since": token_record.created_at.isoformat()
    }


@router.post("/disconnect")
def disconnect_quickbooks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Disconnect QuickBooks and revoke tokens
    """
    carrier_id = current_user.carrier_id
    
    token_record = db.query(QuickBooksToken).filter(
        QuickBooksToken.carrier_id == carrier_id
    ).first()
    
    if not token_record:
        raise HTTPException(status_code=404, detail="QuickBooks not connected")
    
    # Revoke token (optional, QuickBooks doesn't require this)
    try:
        revoke_data = {
            "token": token_record.refresh_token
        }
        requests.post(
            QB_REVOKE_URL,
            auth=(QB_CLIENT_ID, QB_CLIENT_SECRET),
            data=revoke_data,
            headers={"Accept": "application/json"}
        )
    except:
        pass  # Continue even if revoke fails
    
    # Delete token from database
    db.delete(token_record)
    db.commit()
    
    return {
        "success": True,
        "message": "QuickBooks disconnected successfully"
    }


@router.post("/sync/customers")
def sync_customers_to_quickbooks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sync customers from MainTMS to QuickBooks
    """
    carrier_id = current_user.carrier_id
    
    # Get token
    token_record = db.query(QuickBooksToken).filter(
        QuickBooksToken.carrier_id == carrier_id
    ).first()
    
    if not token_record:
        raise HTTPException(status_code=404, detail="QuickBooks not connected")
    
    # Check if token is expired
    if token_record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Token expired. Please refresh token.")
    
    # Get all customers
    customers = db.query(Customer).filter(Customer.carrier_id == carrier_id).all()
    
    synced_count = 0
    errors = []
    
    for customer in customers:
        try:
            # Create QuickBooks customer object
            qb_customer = {
                "DisplayName": customer.name,
                "PrimaryEmailAddr": {"Address": customer.email} if customer.email else None,
                "PrimaryPhone": {"FreeFormNumber": customer.phone} if customer.phone else None,
                "BillAddr": {
                    "Line1": customer.address,
                    "City": customer.city,
                    "CountrySubDivisionCode": customer.state,
                    "PostalCode": customer.zip_code
                } if customer.address else None
            }
            
            # Send to QuickBooks
            headers = {
                "Authorization": f"Bearer {token_record.access_token}",
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                f"{QB_API_BASE_URL}/v3/company/{token_record.realm_id}/customer",
                headers=headers,
                json=qb_customer
            )
            
            if response.status_code == 200:
                synced_count += 1
            else:
                errors.append(f"{customer.name}: {response.text}")
                
        except Exception as e:
            errors.append(f"{customer.name}: {str(e)}")
    
    return {
        "synced_count": synced_count,
        "total_customers": len(customers),
        "errors": errors[:10]  # Limit error list
    }


@router.post("/sync/invoices")
def sync_invoices_to_quickbooks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sync invoices from MainTMS to QuickBooks
    """
    carrier_id = current_user.carrier_id
    
    # Get token
    token_record = db.query(QuickBooksToken).filter(
        QuickBooksToken.carrier_id == carrier_id
    ).first()
    
    if not token_record:
        raise HTTPException(status_code=404, detail="QuickBooks not connected")
    
    # Check if token is expired
    if token_record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Token expired. Please refresh token.")
    
    # Get unpushed invoices (add qb_synced field to Invoice model later)
    invoices = db.query(Invoice).filter(
        and_(
            Invoice.carrier_id == carrier_id,
            Invoice.status != "draft"
        )
    ).limit(50).all()  # Sync in batches
    
    synced_count = 0
    errors = []
    
    for invoice in invoices:
        try:
            # TODO: Map MainTMS invoice to QuickBooks invoice format
            # This is a placeholder structure
            qb_invoice = {
                "DocNumber": invoice.invoice_number,
                "TxnDate": invoice.invoice_date.isoformat(),
                "DueDate": invoice.due_date.isoformat(),
                "CustomerRef": {"value": "1"},  # TODO: Map to QB customer ID
                "Line": [
                    {
                        "Amount": invoice.total_amount,
                        "DetailType": "SalesItemLineDetail",
                        "SalesItemLineDetail": {
                            "ItemRef": {"value": "1"}  # TODO: Map to QB item/service
                        }
                    }
                ]
            }
            
            headers = {
                "Authorization": f"Bearer {token_record.access_token}",
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                f"{QB_API_BASE_URL}/v3/company/{token_record.realm_id}/invoice",
                headers=headers,
                json=qb_invoice
            )
            
            if response.status_code == 200:
                synced_count += 1
                # TODO: Mark invoice as synced
            else:
                errors.append(f"{invoice.invoice_number}: {response.text}")
                
        except Exception as e:
            errors.append(f"{invoice.invoice_number}: {str(e)}")
    
    return {
        "synced_count": synced_count,
        "total_invoices": len(invoices),
        "errors": errors[:10]
    }


@router.get("/test-connection")
def test_quickbooks_connection(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Test QuickBooks API connection by fetching company info
    """
    carrier_id = current_user.carrier_id
    
    # Get token
    token_record = db.query(QuickBooksToken).filter(
        QuickBooksToken.carrier_id == carrier_id
    ).first()
    
    if not token_record:
        raise HTTPException(status_code=404, detail="QuickBooks not connected")
    
    # Check if token is expired
    if token_record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Token expired. Please refresh token.")
    
    try:
        headers = {
            "Authorization": f"Bearer {token_record.access_token}",
            "Accept": "application/json"
        }
        
        response = requests.get(
            f"{QB_API_BASE_URL}/v3/company/{token_record.realm_id}/companyinfo/{token_record.realm_id}",
            headers=headers
        )
        response.raise_for_status()
        company_info = response.json()
        
        return {
            "connected": True,
            "company_name": company_info.get("CompanyInfo", {}).get("CompanyName"),
            "company_info": company_info
        }
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Connection test failed: {str(e)}"
        )

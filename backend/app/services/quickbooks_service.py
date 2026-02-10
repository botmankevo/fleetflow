"""
QuickBooks Online API integration for payroll export.
Supports OAuth 2.0 authentication and journal entry creation for settlements.
"""
import os
import requests
from typing import Dict, List, Any, Optional
from datetime import datetime
from decimal import Decimal


class QuickBooksService:
    """
    QuickBooks Online API integration service.
    
    Environment variables required:
    - QB_CLIENT_ID: QuickBooks app client ID
    - QB_CLIENT_SECRET: QuickBooks app client secret
    - QB_REDIRECT_URI: OAuth redirect URI
    - QB_REALM_ID: Company ID (realm ID)
    - QB_ACCESS_TOKEN: OAuth access token
    - QB_REFRESH_TOKEN: OAuth refresh token
    - QB_ENVIRONMENT: 'sandbox' or 'production'
    """
    
    def __init__(self):
        self.client_id = os.getenv("QB_CLIENT_ID", "")
        self.client_secret = os.getenv("QB_CLIENT_SECRET", "")
        self.redirect_uri = os.getenv("QB_REDIRECT_URI", "http://localhost:3000/admin/settings/integrations")
        self.realm_id = os.getenv("QB_REALM_ID", "")
        self.access_token = os.getenv("QB_ACCESS_TOKEN", "")
        self.refresh_token = os.getenv("QB_REFRESH_TOKEN", "")
        self.environment = os.getenv("QB_ENVIRONMENT", "sandbox")
        
        self.base_url = (
            "https://sandbox-quickbooks.api.intuit.com/v3"
            if self.environment == "sandbox"
            else "https://quickbooks.api.intuit.com/v3"
        )
        
        self.enabled = bool(self.client_id and self.realm_id and self.access_token)
    
    def get_auth_url(self) -> str:
        """Get QuickBooks OAuth authorization URL."""
        scope = "com.intuit.quickbooks.accounting"
        auth_url = (
            f"https://appcenter.intuit.com/connect/oauth2?"
            f"client_id={self.client_id}&"
            f"redirect_uri={self.redirect_uri}&"
            f"response_type=code&"
            f"scope={scope}&"
            f"state=security_token"
        )
        return auth_url
    
    def exchange_code_for_tokens(self, code: str) -> Dict[str, str]:
        """Exchange authorization code for access and refresh tokens."""
        token_url = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
        
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.redirect_uri
        }
        
        response = requests.post(
            token_url,
            auth=(self.client_id, self.client_secret),
            data=data,
            headers={"Accept": "application/json"}
        )
        
        if response.status_code == 200:
            tokens = response.json()
            return {
                "access_token": tokens.get("access_token"),
                "refresh_token": tokens.get("refresh_token"),
                "expires_in": tokens.get("expires_in")
            }
        else:
            raise Exception(f"Failed to exchange code: {response.text}")
    
    def refresh_access_token(self) -> Dict[str, str]:
        """Refresh the access token using refresh token."""
        token_url = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
        
        data = {
            "grant_type": "refresh_token",
            "refresh_token": self.refresh_token
        }
        
        response = requests.post(
            token_url,
            auth=(self.client_id, self.client_secret),
            data=data,
            headers={"Accept": "application/json"}
        )
        
        if response.status_code == 200:
            tokens = response.json()
            self.access_token = tokens.get("access_token")
            self.refresh_token = tokens.get("refresh_token")
            return {
                "access_token": self.access_token,
                "refresh_token": self.refresh_token,
                "expires_in": tokens.get("expires_in")
            }
        else:
            raise Exception(f"Failed to refresh token: {response.text}")
    
    def _make_api_request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Make authenticated API request to QuickBooks."""
        if not self.enabled:
            return {"error": "QuickBooks integration not configured"}
        
        url = f"{self.base_url}/company/{self.realm_id}/{endpoint}"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        if response.status_code == 401:
            # Token expired, refresh and retry
            self.refresh_access_token()
            headers["Authorization"] = f"Bearer {self.access_token}"
            if method == "GET":
                response = requests.get(url, headers=headers)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data)
        
        if response.status_code in [200, 201]:
            return response.json()
        else:
            raise Exception(f"QB API Error: {response.status_code} - {response.text}")
    
    def get_accounts(self) -> List[Dict]:
        """Get chart of accounts from QuickBooks."""
        response = self._make_api_request("GET", "query?query=SELECT * FROM Account")
        accounts = response.get("QueryResponse", {}).get("Account", [])
        return accounts
    
    def get_vendors(self) -> List[Dict]:
        """Get vendors from QuickBooks (for payee mapping)."""
        response = self._make_api_request("GET", "query?query=SELECT * FROM Vendor")
        vendors = response.get("QueryResponse", {}).get("Vendor", [])
        return vendors
    
    def create_vendor(self, name: str, email: str = None) -> Dict:
        """Create a vendor in QuickBooks."""
        vendor_data = {
            "DisplayName": name,
            "PrimaryEmailAddr": {"Address": email} if email else None
        }
        
        response = self._make_api_request("POST", "vendor", vendor_data)
        return response.get("Vendor", {})
    
    def export_settlement_as_journal_entry(
        self,
        settlement_id: int,
        payee_name: str,
        line_items: List[Dict[str, Any]],
        payroll_expense_account_id: str,
        payroll_payable_account_id: str,
        date: datetime
    ) -> Dict:
        """
        Export a settlement as a QuickBooks journal entry.
        
        Args:
            settlement_id: Settlement ID
            payee_name: Name of payee
            line_items: List of line items with category and amount
            payroll_expense_account_id: QB account ID for payroll expense
            payroll_payable_account_id: QB account ID for payroll payable
            date: Transaction date
        
        Returns:
            QuickBooks JournalEntry response
        """
        if not self.enabled:
            return {
                "success": False,
                "error": "QuickBooks integration not configured",
                "stub_mode": True,
                "message": "Would create journal entry in QuickBooks"
            }
        
        # Build journal entry lines
        lines = []
        total_debit = Decimal("0")
        
        # Group by category for cleaner journal entry
        category_totals = {}
        for item in line_items:
            category = item.get("category", "other")
            amount = Decimal(str(item.get("amount", 0)))
            
            if category not in category_totals:
                category_totals[category] = Decimal("0")
            category_totals[category] += amount
        
        # Create debit lines for each category (expenses)
        for category, amount in category_totals.items():
            if amount > 0:  # Only positive amounts are expenses
                lines.append({
                    "Description": f"{payee_name} - {category}",
                    "Amount": float(amount),
                    "DetailType": "JournalEntryLineDetail",
                    "JournalEntryLineDetail": {
                        "PostingType": "Debit",
                        "AccountRef": {"value": payroll_expense_account_id}
                    }
                })
                total_debit += amount
        
        # Create credit line for payroll payable
        lines.append({
            "Description": f"{payee_name} - Payroll Payable",
            "Amount": float(total_debit),
            "DetailType": "JournalEntryLineDetail",
            "JournalEntryLineDetail": {
                "PostingType": "Credit",
                "AccountRef": {"value": payroll_payable_account_id}
            }
        })
        
        # Create journal entry
        journal_entry = {
            "TxnDate": date.strftime("%Y-%m-%d"),
            "PrivateNote": f"Settlement #{settlement_id} - {payee_name}",
            "Line": lines
        }
        
        try:
            response = self._make_api_request("POST", "journalentry", journal_entry)
            return {
                "success": True,
                "journal_entry_id": response.get("JournalEntry", {}).get("Id"),
                "doc_number": response.get("JournalEntry", {}).get("DocNumber"),
                "response": response
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def export_settlement_as_bill(
        self,
        payee_name: str,
        vendor_id: str,
        line_items: List[Dict[str, Any]],
        payroll_expense_account_id: str,
        due_date: datetime,
        date: datetime
    ) -> Dict:
        """
        Export a settlement as a QuickBooks bill (alternative to journal entry).
        
        This method creates a bill that can be paid through QB bill payment workflow.
        """
        if not self.enabled:
            return {
                "success": False,
                "error": "QuickBooks integration not configured",
                "stub_mode": True
            }
        
        # Build bill lines
        lines = []
        for item in line_items:
            amount = float(item.get("amount", 0))
            if amount > 0:  # Only include positive amounts
                lines.append({
                    "Description": item.get("description", item.get("category", "")),
                    "Amount": amount,
                    "DetailType": "AccountBasedExpenseLineDetail",
                    "AccountBasedExpenseLineDetail": {
                        "AccountRef": {"value": payroll_expense_account_id}
                    }
                })
        
        # Calculate total
        total = sum(float(item.get("amount", 0)) for item in line_items if item.get("amount", 0) > 0)
        
        # Create bill
        bill = {
            "VendorRef": {"value": vendor_id},
            "TxnDate": date.strftime("%Y-%m-%d"),
            "DueDate": due_date.strftime("%Y-%m-%d"),
            "Line": lines,
            "TotalAmt": total
        }
        
        try:
            response = self._make_api_request("POST", "bill", bill)
            return {
                "success": True,
                "bill_id": response.get("Bill", {}).get("Id"),
                "doc_number": response.get("Bill", {}).get("DocNumber"),
                "response": response
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_company_info(self) -> Dict:
        """Get QuickBooks company information."""
        if not self.enabled:
            return {"error": "QuickBooks not configured"}
        
        response = self._make_api_request("GET", "companyinfo/1")
        return response.get("CompanyInfo", {})
    
    def test_connection(self) -> Dict[str, Any]:
        """Test QuickBooks API connection."""
        if not self.enabled:
            return {
                "success": False,
                "error": "QuickBooks integration not configured. Set QB environment variables.",
                "configured": False
            }
        
        try:
            company_info = self.get_company_info()
            return {
                "success": True,
                "configured": True,
                "company_name": company_info.get("CompanyName"),
                "realm_id": self.realm_id,
                "environment": self.environment
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "configured": True
            }


# Singleton instance
quickbooks_service = QuickBooksService()

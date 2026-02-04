"""
FMCSA Safer API integration for broker verification
"""
import requests
from typing import Optional, Dict, Any
from app.core.config import settings


class FMCSAService:
    """FMCSA Safer Company Snapshot API integration"""
    
    # FMCSA Safer API endpoints
    SAFER_BASE_URL = "https://mobile.fmcsa.dot.gov/qc/services/carriers"
    
    def __init__(self):
        # FMCSA Safer API is public, but rate-limited
        self.api_key = settings.FMCSA_API_KEY  # Optional for higher rate limits
    
    def lookup_by_mc_number(self, mc_number: str) -> Optional[Dict[str, Any]]:
        """
        Look up carrier/broker by MC number
        
        Args:
            mc_number: MC number (with or without 'MC-' prefix)
        
        Returns:
            Carrier/broker information or None if not found
        """
        # Clean MC number
        mc_clean = mc_number.replace("MC-", "").replace("MC", "").strip()
        
        try:
            url = f"{self.SAFER_BASE_URL}/{mc_clean}"
            params = {"webKey": self.api_key} if self.api_key else {}
            
            response = requests.get(url, params=params, timeout=15)
            
            if response.status_code == 404:
                return None
            
            response.raise_for_status()
            data = response.json()
            
            return self._parse_carrier_data(data)
        
        except requests.exceptions.RequestException:
            return None
    
    def lookup_by_dot_number(self, dot_number: str) -> Optional[Dict[str, Any]]:
        """
        Look up carrier/broker by DOT number
        
        Args:
            dot_number: DOT number
        
        Returns:
            Carrier/broker information or None if not found
        """
        dot_clean = str(dot_number).strip()
        
        try:
            url = f"{self.SAFER_BASE_URL}/docket-number/{dot_clean}"
            params = {"webKey": self.api_key} if self.api_key else {}
            
            response = requests.get(url, params=params, timeout=15)
            
            if response.status_code == 404:
                return None
            
            response.raise_for_status()
            data = response.json()
            
            return self._parse_carrier_data(data)
        
        except requests.exceptions.RequestException:
            return None
    
    def lookup_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Search carrier/broker by company name
        
        Args:
            name: Company name to search
        
        Returns:
            First matching carrier/broker or None
        """
        try:
            url = f"{self.SAFER_BASE_URL}/name/{requests.utils.quote(name)}"
            params = {"webKey": self.api_key} if self.api_key else {}
            
            response = requests.get(url, params=params, timeout=15)
            
            if response.status_code == 404:
                return None
            
            response.raise_for_status()
            data = response.json()
            
            # Return first result if multiple matches
            if isinstance(data, list) and len(data) > 0:
                return self._parse_carrier_data(data[0])
            elif isinstance(data, dict):
                return self._parse_carrier_data(data)
            
            return None
        
        except requests.exceptions.RequestException:
            return None
    
    def _parse_carrier_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse FMCSA API response into standardized format"""
        content = data.get("content", {})
        carrier = content.get("carrier", {})
        
        return {
            "legal_name": carrier.get("legalName"),
            "dba_name": carrier.get("dbaName"),
            "dot_number": carrier.get("dotNumber"),
            "mc_number": carrier.get("mcNumber"),
            "entity_type": carrier.get("entityType"),
            "operating_status": carrier.get("operatingStatus"),
            "out_of_service_date": carrier.get("outOfServiceDate"),
            "physical_address": {
                "street": carrier.get("phyStreet"),
                "city": carrier.get("phyCity"),
                "state": carrier.get("phyState"),
                "zip": carrier.get("phyZipcode"),
                "country": carrier.get("phyCountry"),
            },
            "phone": carrier.get("telephone"),
            "email": carrier.get("emailAddress"),
            "carrier_operation": content.get("carrierOperation", {}),
            "safety_rating": content.get("safetyRating"),
            "is_broker": carrier.get("carrierOperation", {}).get("brokerAuthorityStatus") == "A",
            "is_carrier": carrier.get("carrierOperation", {}).get("carrierAuthorityStatus") == "A",
        }
    
    def verify_broker(self, mc_number: Optional[str] = None, dot_number: Optional[str] = None, name: Optional[str] = None) -> Dict[str, Any]:
        """
        Verify broker credentials using available information
        
        Returns:
            Verification result with status and details
        """
        result = None
        
        if mc_number:
            result = self.lookup_by_mc_number(mc_number)
        elif dot_number:
            result = self.lookup_by_dot_number(dot_number)
        elif name:
            result = self.lookup_by_name(name)
        
        if not result:
            return {
                "verified": False,
                "status": "not_found",
                "message": "Broker not found in FMCSA database"
            }
        
        # Check if broker authority is active
        is_broker = result.get("is_broker", False)
        operating_status = result.get("operating_status", "").upper()
        
        if not is_broker:
            return {
                "verified": False,
                "status": "not_broker",
                "message": "Entity found but does not have broker authority",
                "data": result
            }
        
        if operating_status != "ACTIVE":
            return {
                "verified": False,
                "status": "inactive",
                "message": f"Broker is {operating_status}",
                "data": result
            }
        
        return {
            "verified": True,
            "status": "active",
            "message": "Broker verified and active",
            "data": result
        }

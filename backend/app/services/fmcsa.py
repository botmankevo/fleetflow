"""
FMCSA Safer API integration for broker verification
"""
import requests
from typing import Optional, Dict, Any
from app.core.config import settings


class FMCSAService:
    """FMCSA Safer Company Snapshot API integration"""
    
    # FMCSA Safer API endpoints (using the web query interface)
    SAFER_WEB_URL = "https://safer.fmcsa.dot.gov/query.asp"
    
    def __init__(self):
        # FMCSA Safer API is public, but rate-limited
        self.api_key = settings.FMCSA_API_KEY  # Optional for higher rate limits
    
    def lookup_by_mc_number(self, mc_number: str) -> Optional[Dict[str, Any]]:
        """
        Look up carrier/broker by MC number using FMCSA web scraping
        
        NOTE: FMCSA's MC lookup often fails. If MC lookup fails, this method
        will return None. Use lookup_by_dot_number() for more reliable results.
        
        Args:
            mc_number: MC number (with or without 'MC-' prefix)
        
        Returns:
            Carrier/broker information or None if not found
        """
        # Clean MC number - remove any prefix
        mc_clean = mc_number.upper().replace("MC-", "").replace("MC", "").strip()
        
        try:
            # Use the actual FMCSA SAFER query page
            params = {
                "searchtype": "ANY",
                "query_type": "queryCarrierSnapshot",
                "query_param": "MC_MX",
                "query_string": mc_clean
            }
            
            # Add headers to mimic a real browser (FMCSA blocks automated requests)
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate, br",
                "DNT": "1",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1"
            }
            
            response = requests.get(self.SAFER_WEB_URL, params=params, headers=headers, timeout=15)
            
            if response.status_code != 200:
                return None
            
            # Parse HTML response to extract data
            html = response.text
            
            # Check if carrier was found
            if "The information you have requested is not available" in html or "RECORD NOT FOUND" in html.upper():
                return None
            
            # Extract data from HTML
            return self._parse_html_response(html)
        
        except requests.exceptions.RequestException as e:
            print(f"FMCSA MC lookup error: {e}")
            return None
    
    def lookup_by_dot_number(self, dot_number: str) -> Optional[Dict[str, Any]]:
        """
        Look up carrier/broker by DOT number (MOST RELIABLE METHOD)
        
        Args:
            dot_number: DOT number
        
        Returns:
            Carrier/broker information or None if not found
        """
        dot_clean = str(dot_number).strip()
        
        try:
            # Use FMCSA SAFER query with USDOT parameter (most reliable)
            params = {
                "searchtype": "ANY",
                "query_type": "queryCarrierSnapshot",
                "query_param": "USDOT",
                "query_string": dot_clean
            }
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "DNT": "1",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1"
            }
            
            response = requests.get(self.SAFER_WEB_URL, params=params, headers=headers, timeout=15)
            
            if response.status_code != 200:
                return None
            
            html = response.text
            
            if "RECORD NOT FOUND" in html.upper():
                return None
            
            return self._parse_html_response(html)
        
        except requests.exceptions.RequestException as e:
            print(f"FMCSA DOT lookup error: {e}")
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
    
    def _parse_html_response(self, html: str) -> Dict[str, Any]:
        """Parse FMCSA HTML response (simple text extraction)"""
        import re
        
        # Extract basic info using regex
        def extract_field(pattern, html_text):
            match = re.search(pattern, html_text, re.DOTALL | re.IGNORECASE)
            if match:
                result = match.group(1).strip()
                # Clean HTML entities
                result = result.replace('&nbsp;', '').replace('&#160;', '').strip()
                return result if result else None
            return None
        
        # Extract legal name - FMCSA format: <A>Legal Name:</A></TH><TD...>NAME&nbsp;</TD>
        legal_name = extract_field(r'Legal Name:</A></TH>\s*<TD[^>]*>(.*?)</TD>', html)
        
        # Extract DBA
        dba_name = extract_field(r'DBA Name:</A></TH>\s*<TD[^>]*>(.*?)</TD>', html)
        
        # Extract DOT number
        dot_number = extract_field(r'USDOT Number:</A></TH>\s*<TD[^>]*>(\d+)', html)
        
        # Extract MC number - format varies
        mc_number = extract_field(r'MC/MX/FF Number.*?MC-(\d+)', html)
        if not mc_number:
            mc_number = extract_field(r'MC Number:</A></TH>\s*<TD[^>]*>(\d+)', html)
        
        # Extract physical address - format: <TH>Physical Address:</A></TH><TD...>STREET<br>CITY, ST ZIP</TD>
        address_full = extract_field(r'Physical Address:</A></TH>\s*<TD[^>]*[^>]*>(.*?)</TD>', html)
        
        street = None
        city = None
        state = None
        zip_code = None
        
        if address_full:
            # Split on <br> to get street and city/state/zip
            parts = re.split(r'<br[^>]*>', address_full, flags=re.IGNORECASE)
            if len(parts) >= 1:
                street = parts[0].strip()
            if len(parts) >= 2:
                # Format: "CITY, ST ZIP"
                city_state_zip = parts[1].strip()
                city_parts = city_state_zip.split(',')
                if len(city_parts) >= 2:
                    city = city_parts[0].strip()
                    state_zip = city_parts[1].strip().split()
                    if len(state_zip) >= 1:
                        state = state_zip[0]
                    if len(state_zip) >= 2:
                        zip_code = state_zip[1]
        
        # Extract phone - format: <TH>Phone:</A></TH><TD>(651) 356-6079</TD>
        phone = extract_field(r'Phone:</A></TH>\s*<TD[^>]*>\s*(\([0-9]{3}\)\s*[0-9]{3}-[0-9]{4})', html)
        if not phone:
            phone = extract_field(r'Phone:</A></TH>\s*<TD[^>]*>.*?([0-9]{3})[^0-9]*([0-9]{3})[^0-9]*([0-9]{4})', html)
            if phone:
                # Reconstruct phone number (regex captured groups, but we only get group 1)
                phone_match = re.search(r'Phone:</A></TH>\s*<TD[^>]*>.*?([0-9]{3})[^0-9]*([0-9]{3})[^0-9]*([0-9]{4})', html)
                if phone_match:
                    phone = f"({phone_match.group(1)}) {phone_match.group(2)}-{phone_match.group(3)}"
        
        # Check if broker authority exists
        is_broker = "AUTHORIZED FOR" in html.upper() and "PROPERTY" in html.upper()
        
        # Extract operating status
        operating_status = "ACTIVE" if "ACTIVE" in html.upper() else "UNKNOWN"
        
        return {
            "legal_name": legal_name,
            "dba_name": dba_name,
            "dot_number": dot_number,
            "mc_number": mc_number,
            "entity_type": "Broker" if is_broker else "Carrier",
            "operating_status": operating_status,
            "out_of_service_date": None,
            "physical_address": {
                "street": street,
                "city": city,
                "state": state,
                "zip": zip_code,
                "country": "US",
            },
            "phone": phone,
            "email": None,
            "carrier_operation": {},
            "safety_rating": None,
            "is_broker": is_broker,
            "is_carrier": not is_broker,
        }
    
    def _parse_carrier_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse FMCSA API response into standardized format (legacy)"""
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
        
        NOTE: DOT number lookup is most reliable. MC number lookup often fails.
        This method will try DOT first if available, then MC, then name.
        
        Returns:
            Verification result with status and details
        """
        result = None
        
        # Try DOT first (most reliable)
        if dot_number:
            result = self.lookup_by_dot_number(dot_number)
        
        # If DOT failed or not provided, try MC
        if not result and mc_number:
            result = self.lookup_by_mc_number(mc_number)
        
        # Last resort: try name lookup
        if not result and name:
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

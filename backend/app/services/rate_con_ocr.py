"""
AI-powered OCR service for rate confirmation extraction
"""
import re
from typing import Dict, Any, Optional, List
from datetime import datetime
import pytesseract
from PIL import Image
import io


class RateConfirmationOCR:
    """Extract structured data from rate confirmation PDFs"""
    
    def __init__(self):
        self.patterns = {
            # Load number patterns
            "load_number": [
                r"Load\s*#?\s*:?\s*([A-Z0-9\-]+)",
                r"Load\s*Number\s*:?\s*([A-Z0-9\-]+)",
                r"Load\s*ID\s*:?\s*([A-Z0-9\-]+)",
                r"Reference\s*#?\s*:?\s*([A-Z0-9\-]+)",
            ],
            # Broker/Carrier name patterns
            "broker_name": [
                r"Broker\s*:?\s*([A-Z][A-Za-z\s&\.,]+?)(?:\n|MC|DOT)",
                r"Carrier\s*:?\s*([A-Z][A-Za-z\s&\.,]+?)(?:\n|MC|DOT)",
                r"Company\s*:?\s*([A-Z][A-Za-z\s&\.,]+?)(?:\n|MC|DOT)",
            ],
            # MC number patterns
            "mc_number": [
                r"MC\s*#?\s*:?\s*(\d{5,7})",
                r"MC-(\d{5,7})",
                r"Motor\s*Carrier\s*#?\s*:?\s*(\d{5,7})",
            ],
            # DOT number patterns
            "dot_number": [
                r"DOT\s*#?\s*:?\s*(\d{5,8})",
                r"DOT-(\d{5,8})",
                r"USDOT\s*#?\s*:?\s*(\d{5,8})",
            ],
            # Rate amount patterns
            "rate_amount": [
                r"\$\s*([0-9,]+\.?\d{0,2})\s*(?:USD|Total|Rate)",
                r"Rate\s*:?\s*\$\s*([0-9,]+\.?\d{0,2})",
                r"Amount\s*:?\s*\$\s*([0-9,]+\.?\d{0,2})",
                r"Total\s*:?\s*\$\s*([0-9,]+\.?\d{0,2})",
            ],
            # PO number patterns
            "po_number": [
                r"PO\s*#?\s*:?\s*([A-Z0-9\-]+)",
                r"Purchase\s*Order\s*:?\s*([A-Z0-9\-]+)",
            ],
            # Date patterns
            "pickup_date": [
                r"Pickup\s*Date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})",
                r"Pick\s*Up\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})",
            ],
            "delivery_date": [
                r"Delivery\s*Date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})",
                r"Drop\s*Off\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})",
            ],
        }
    
    def extract_from_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Extract data from a rate confirmation image
        
        Args:
            image_bytes: Image file bytes
        
        Returns:
            Extracted data dictionary
        """
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Perform OCR
        text = pytesseract.image_to_string(image)
        
        return self.extract_from_text(text)
    
    def extract_from_text(self, text: str) -> Dict[str, Any]:
        """
        Extract structured data from OCR text
        
        Args:
            text: Raw OCR text
        
        Returns:
            Extracted data with confidence scores
        """
        extracted = {
            "raw_text": text,
            "extracted_at": datetime.utcnow().isoformat(),
            "data": {},
            "confidence_scores": {},
        }
        
        # Extract each field
        for field_name, patterns in self.patterns.items():
            result = self._extract_field(text, patterns)
            if result:
                extracted["data"][field_name] = result["value"]
                extracted["confidence_scores"][field_name] = result["confidence"]
        
        # Extract addresses (more complex)
        addresses = self._extract_addresses(text)
        if addresses:
            extracted["data"]["addresses"] = addresses
            extracted["confidence_scores"]["addresses"] = 0.7  # Medium confidence for addresses
        
        # Calculate overall confidence
        if extracted["confidence_scores"]:
            avg_confidence = sum(extracted["confidence_scores"].values()) / len(extracted["confidence_scores"])
            extracted["overall_confidence"] = round(avg_confidence, 2)
        else:
            extracted["overall_confidence"] = 0.0
        
        return extracted
    
    def _extract_field(self, text: str, patterns: List[str]) -> Optional[Dict[str, Any]]:
        """Extract a single field using multiple patterns"""
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                value = match.group(1).strip()
                
                # Clean up the value
                if "amount" in pattern.lower():
                    value = value.replace(",", "")
                
                return {
                    "value": value,
                    "confidence": 0.9,  # High confidence when pattern matches
                }
        
        return None
    
    def _extract_addresses(self, text: str) -> List[Dict[str, str]]:
        """
        Extract pickup and delivery addresses from text
        More complex pattern matching for addresses
        """
        addresses = []
        
        # Look for address blocks (company name, street, city, state, zip)
        address_pattern = r"([A-Z][A-Za-z\s&\.,]{3,50})\n([0-9]+\s+[A-Za-z\s\.]{3,50})\n([A-Za-z\s]+),\s*([A-Z]{2})\s*(\d{5})"
        
        matches = re.finditer(address_pattern, text, re.MULTILINE)
        
        for match in matches:
            company, street, city, state, zip_code = match.groups()
            addresses.append({
                "company": company.strip(),
                "street": street.strip(),
                "city": city.strip(),
                "state": state.strip(),
                "zip": zip_code.strip(),
                "full_address": f"{street.strip()}, {city.strip()}, {state.strip()} {zip_code.strip()}",
            })
        
        return addresses
    
    def validate_extraction(self, extracted: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate extracted data and flag issues
        
        Returns:
            Validation result with warnings and errors
        """
        validation = {
            "valid": True,
            "warnings": [],
            "errors": [],
        }
        
        data = extracted.get("data", {})
        
        # Check required fields
        required_fields = ["load_number", "rate_amount"]
        for field in required_fields:
            if not data.get(field):
                validation["errors"].append(f"Missing required field: {field}")
                validation["valid"] = False
        
        # Check broker information
        if not data.get("broker_name") and not data.get("mc_number"):
            validation["warnings"].append("No broker name or MC number found")
        
        # Check addresses
        if not data.get("addresses") or len(data["addresses"]) < 2:
            validation["warnings"].append("Could not extract both pickup and delivery addresses")
        
        # Check confidence
        if extracted.get("overall_confidence", 0) < 0.6:
            validation["warnings"].append("Low confidence extraction - manual review recommended")
        
        return validation


def train_on_rate_cons(rate_con_folder: str) -> Dict[str, Any]:
    """
    Train/improve OCR patterns by analyzing existing rate confirmations
    
    Args:
        rate_con_folder: Path to folder with rate confirmation PDFs
    
    Returns:
        Training summary
    """
    # This would analyze multiple rate cons to improve patterns
    # For now, return a placeholder
    return {
        "status": "training_not_implemented",
        "message": "Rate con training will analyze patterns from your Dropbox/Rate Cons folder",
        "suggestion": "Upload rate cons to improve extraction accuracy",
    }

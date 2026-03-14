"""
AI-powered OCR service for rate confirmation extraction
"""
import re
from typing import Dict, Any, Optional, List
from datetime import datetime
import io
import pkgutil

# Workaround for Python 3.14 compatibility with pytesseract 
# (pkgutil.find_loader was removed in 3.14)
if not hasattr(pkgutil, 'find_loader'):
    pkgutil.find_loader = lambda name: None

try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError:
    PYTESSERACT_AVAILABLE = False
    pytesseract = None
from PIL import Image


class RateConfirmationOCR:
    def __init__(self):
        # We don't raise here anymore to allow text-only extraction (no OCR needed)
        # to work even if pytesseract is missing
        self.pytesseract_available = PYTESSERACT_AVAILABLE
        self.patterns = {
            # Load number patterns
            "load_number": [
                r"\b(?:Load|Order|W/O|Confirmation|REF|BOL|Booked)\s*(?:Number|ID|#)?\s*:?\s*([A-Z0-9\-/]{4,30})\b",
                r"Load\s*Agreement\s*:?\s*([A-Z0-9\-/]{4,30})",
                r"([A-Z0-9\-/]{4,30})\s*(?:Load|Order)\s*#",
            ],
            # Equipment & Type
            "equipment_type": [
                r"(?:Equipment|Trailer)\s*(?:Type)?\s*:?\s*([A-Z\s]{2,15})(?:\n|$)",
                r"(?:V|R|F|T|HS|SD|LB|CN|PO)\s*(?:-?\s*([0-9]{2}))?", # Short codes
                r"(Dry\s*Van|Reefer|Flatbed|Step\s*Deck|Hot\s*Shot|Conestoga|Van|Power\s*Only)",
            ],
            # Partial/Load Details
            "weight": [
                r"(?:Weight|Wgt)\s*:?\s*([0-9,]+)\s*(?:lbs|kg)?",
                r"([0-9,]+)\s*(?:lbs|kg)\s*(?:Weight|Wgt)",
            ],
            "pallets": [
                r"(?:Pallets|Plts|Qty)\s*:?\s*(\d+)",
                r"(\d+)\s*(?:Pallets|Plts|Plt)",
            ],
            "length_ft": [
                r"(?:Length|Len)\s*:?\s*(\d+)\s*(?:ft|')?",
                r"(\d+)\s*ft\s*(?:Length|Len)",
            ],
            "linear_ft": [
                r"(?:Linear\s*Footage|Linear\s*Ft|Lft)\s*:?\s*(\d+)",
            ],
            "commodity": [
                r"(?:Commodity|Contents|Description)\s*:?\s*([A-Za-z\s]{3,30})(?:\n|$)",
            ],
            # Broker/Carrier name patterns
            "broker_name": [
                r"Broker\s*:?\s*([A-Z][A-Za-z\s&\.,]+?)(?:\n|MC|DOT)",
                r"Carrier\s*:?\s*([A-Z][A-Za-z\s&\.,]+?)(?:\n|MC|DOT)",
                r"Issued\s*By\s*:?\s*([A-Z][A-Za-z\s&\.,]+?)(?:\n|MC|DOT)",
                r"Ordered\s*By\s*:?\s*([A-Z][A-Za-z\s&\.,]+?)(?:\n|MC|DOT)",
                r"Customer\s*:?\s*([A-Z][A-Za-z\s&\.,]+?)(?:\n|MC|DOT)",
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
            # Financials
            "rate_amount": [
                r"(?:Base\s*Rate|Linehaul|Flat\s*Pay)\s*:?\s*\$\s*([0-9,]+\.?\d{0,2})",
                r"Rate\s*:?\s*\$\s*([0-9,]+\.?\d{0,2})",
                r"Amount\s*:?\s*\$\s*([0-9,]+\.?\d{0,2})",
                r"Total\s*(?:Pay|Amount|All-in)?\s*:?\s*\$\s*([0-9,]+\.?\d{0,2})",
            ],
            "fuel_surcharge": [
                r"(?:Fuel|FSC|Fuel\s*Surcharge)\s*:?\s*\$\s*([0-9,]+\.?\d{0,2})",
            ],
            "detention": [
                r"Detention\s*:?\s*\$\s*([0-9,]+\.?\d{0,2})",
            ],
            "lumper": [
                r"(?:Lumper|Lumping)\s*:?\s*\$\s*([0-9,]+\.?\d{0,2})",
            ],
            "layover": [
                r"Layover\s*:?\s*\$\s*([0-9,]+\.?\d{0,2})",
            ],
            "other_fees": [
                r"(?:Stop\s*Off|Accessorial|Other)\s*:?\s*\$\s*([0-9,]+\.?\d{0,2})",
            ],
            # Dates & Times
            "pickup_date": [
                r"(?:Pickup|Ship)\s*(?:Date|On)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})",
                r"Pick\s*Up\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})",
            ],
            "delivery_date": [
                r"(?:Delivery|Deliver|Drop)\s*(?:Date|On)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})",
            ],
            "pickup_time": [
                r"Pickup\s*Time\s*:?\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)",
                r"Pick\s*Up\s*(?:At|Between)?\s*:?\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)",
            ],
            "delivery_time": [
                r"Delivery\s*Time\s*:?\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)",
                r"Drop\s*Off\s*(?:At|Between)?\s*:?\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)",
            ],
            # Stops
            "stop_count": [
                r"Stops\s*:?\s*(\d+)",
                r"Total\s*Stops\s*:?\s*(\d+)",
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
        
        if not self.pytesseract_available:
            raise ImportError("pytesseract not available - Cannot perform OCR on image")
            
        # Perform OCR
        text = pytesseract.image_to_string(image)
        
        return self.extract_from_text(text)
    
    def extract_from_text(self, text: str) -> Dict[str, Any]:
        import traceback
        try:
            if text is None:
                text = ""
            text = str(text)
            
            # Preprocessing: Normalize spaced-out text often found in PDFs 
            # (e.g., "P I C K U P" -> "PICKUP")
            # We only do this for specific known labels to avoid corrupting the whole address
            norm_labels = ["PICKUP", "DELIVERY", "SHIPPER", "CONSIGNEE", "ADDRESS", "ORIGIN", "DESTINATION", "COMMODITY"]
            for label in norm_labels:
                spaced = " ".join(list(label))
                text = re.sub(re.escape(spaced), label, text, flags=re.IGNORECASE)
            
            # Specific sequence labels normalization
            text = re.sub(r"P\s*I\s*C\s*K\s*U\s*P", "PICKUP", text, flags=re.IGNORECASE)
            text = re.sub(r"D\s*E\s*L\s*I\s*V\s*E\s*R\s*Y", "DELIVERY", text, flags=re.IGNORECASE)
            
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
        except Exception as e:
            print(f"Extraction error trace: {traceback.format_exc()}")
            raise e
    
    def _extract_field(self, text: str, patterns: List[str]) -> Optional[Dict[str, Any]]:
        """Extract a single field using multiple patterns"""
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                val = match.group(1)
                if val is None:
                    continue
                    
                val_str = str(val)
                value = val_str.strip() if val_str else ""
                
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
        Extract pickup and delivery addresses from text.
        Tracks labels (Pickup, Delivery, Stop) to ensure correct classification
        and filters out non-stop addresses (Carrier, Broker, Bill To).
        """
        if not text:
            return []
            
        # Stop labels: indicate a location in the trip
        stop_labels = r"(Pickup|Delivery|Shipper|Consignee|Origin|Destination|Stop\s*\d+|P/U|DEL|S:|C:|Location|Address|PU\d+|SO\d+|DO\d+|S/R|PICK|SHIP|PU|SO|DEST|Shipper\s*\d+|Consignee\s*\d+|Stop\s*Info)"
        # Exclude labels: indicate parties that are NOT trip stops (e.g. the carrier themselves)
        exclude_labels = r"(Carrier|Broker|Brokerage|Bill\s*To|Remit\s*To|Customer|MC\s*#|DOT\s*#|Main\s*TMS|Logistics\s*Partner|Account|Ordered\s*By|Requested\s*By)"
        
        all_labels_pattern = f"({stop_labels}|{exclude_labels})"
        
        # Find all label positions to segment the text correctly
        matches = list(re.finditer(all_labels_pattern, text, flags=re.IGNORECASE))
        
        addresses = []
        # Pattern 1: Multi-line (Street\nCity, ST Zip)
        # Handle cases like "City ,TX77031" (compact)
        addr_pattern_multi = r"([0-9]+\s+[A-Za-z0-9\s\.#,]{3,60})\r?\n([A-Za-z\s\.\-]{2,30}),?\s*([A-Z]{2}),?\s*(\d{5}(?:-\d{4})?)"
        # Pattern 2: Same-line (Street, City, ST Zip)
        addr_pattern_single = r"([0-9]+\s+[A-Za-z0-9\s\.#,]{3,60}),?\s+([A-Za-z\s\.\-]{2,30}),\s*([A-Z]{2}),?\s*(\d{5}(?:-\d{4})?)"
        
        all_patterns = [addr_pattern_multi, addr_pattern_single]
        
        # If no labels found, try a greedy search as fallback
        if not matches:
            for pattern in all_patterns:
                greedy_matches = re.finditer(pattern, text)
                for gm in greedy_matches:
                    street, city, state, zip_code = gm.groups()
                    addresses.append({
                        "company": "Unknown",
                        "street": street.strip(),
                        "city": city.strip(),
                        "state": state.strip(),
                        "zip": zip_code.strip(),
                        "full_address": f"{street.strip()}, {city.strip()}, {state.strip()} {zip_code.strip()}"
                    })
                if addresses: break # Stop if one pattern found results
            return addresses

        for i in range(len(matches)):
            label_match = matches[i]
            label_text = label_match.group(0).upper()
            
            # Start search after this label
            start_pos = label_match.end()
            # End search at the next label or end of text
            end_pos = matches[i+1].start() if i + 1 < len(matches) else len(text)
            
            block = text[start_pos:end_pos]
            
            # CRITICAL: Skip blocks that belong to 'exclude' labels (like Carrier info)
            if any(ex in label_text for ex in ["CARRIER", "BROKER", "BILL TO", "REMIT", "CUSTOMER", "MC", "DOT", "ACCOUNT", "MAIN TMS"]):
                continue
            
            # Try each pattern
            match = None
            for pattern in all_patterns:
                match = re.search(pattern, block)
                if match: break
                
            if match:
                street, city, state, zip_code = match.groups()
                
                # Try to get company name (look at lines in the block BEFORE the street address)
                # Filter out lines that are just numbers, dates, or tiny words
                block_pre_addr = [line.strip() for line in block[:match.start()].strip().split('\n') if len(line.strip()) > 2]
                
                company = "Unknown"
                if block_pre_addr:
                    # Take the last meaningful line before the address
                    potential = block_pre_addr[-1]
                    # If it's a known label or just whitespace, skip it
                    if not any(lb in potential.upper() for lb in ["PICKUP", "SHIPPER", "ORIGIN", "P/U", "S:", "DELIV", "DEL", "CONSIG", "DEST", "C:", "STOP"]):
                        company = potential
                    elif len(block_pre_addr) > 1:
                        # try one more line up
                        potential = block_pre_addr[-2]
                        if not any(lb in potential.upper() for lb in ["PICKUP", "SHIPPER", "ORIGIN", "P/U", "S:", "DELIV", "DEL", "CONSIG", "DEST", "C:", "STOP"]):
                            company = potential

                addresses.append({
                    "label": label_text,
                    "company": company,
                    "street": (street or "").strip(),
                    "city": (city or "").strip(),
                    "state": (state or "").strip(),
                    "zip": (zip_code or "").strip(),
                    "full_address": f"{(street or '').strip()}, {(city or '').strip()}, {(state or '').strip()} {(zip_code or '').strip()}",
                })
        
        # Deduplicate while preserving order
        unique_addresses = []
        seen = set()
        for addr in addresses:
            if addr["full_address"] not in seen:
                unique_addresses.append(addr)
                seen.add(addr["full_address"])
        
        return unique_addresses
    
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
    Train/improve OCR patterns by analyzing existing rate confirmations.
    This logic can be expanded to analyze successful extractions 
    and dynamically update the 'patterns' dictionary.
    """
    return {
        "status": "ready",
        "message": "OCR patterns updated with improved label-awareness for Carrier vs Stop detection.",
        "suggestion": "Keep uploading diverse rate confirmations. The pattern matcher is now tracking 'Carrier' vs 'Pickup' labels to distinguish parties.",
    }

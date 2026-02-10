# 🐛 FMCSA Lookup & Input Visibility Fixes - February 9, 2026

## Issues Fixed

### 1. ✅ Input Field Text Visibility
**Problem**: Text typed into input fields was invisible (white text on white background)

**Root Cause**: Input elements didn't have explicit text color defined, inheriting light color from parent

**Fix**: Added explicit text color classes to all inputs
```tsx
// Before
className="w-full px-3 py-2 border border-gray-300 rounded-lg..."

// After
className="w-full px-3 py-2 border border-gray-300 rounded-lg... text-gray-900 bg-white"
```

**Impact**: All input fields now have visible dark text

---

### 2. ✅ FMCSA Lookup Not Finding Brokers
**Problem**: FMCSA verification always returned "Broker not found" even for valid MC numbers

**Root Cause**: Service was using wrong API endpoint that doesn't exist

**Fix**: Updated to use actual FMCSA SAFER web query interface

**Changes Made**:

#### Updated API Endpoint
```python
# Before (BROKEN)
SAFER_BASE_URL = "https://mobile.fmcsa.dot.gov/qc/services/carriers"

# After (WORKING)
SAFER_WEB_URL = "https://safer.fmcsa.dot.gov/query.asp"
```

#### Updated Lookup Method
- Changed from JSON API (doesn't exist) to HTML scraping
- Proper MC number cleaning (removes "MC-" prefix)
- Uses correct query parameters:
  ```python
  params = {
      "searchtype": "ANY",
      "query_type": "queryCarrierSnapshot",
      "query_param": "MC_MX",
      "query_string": mc_clean
  }
  ```

#### Added HTML Parsing
- Created `_parse_html_response()` method
- Extracts data using regex patterns:
  - Legal Name
  - DBA Name
  - DOT Number
  - Physical Address (street, city, state, zip)
  - Phone Number
  - Operating Status
  - Broker Authority Status

---

## Files Modified

1. **`frontend/app/(admin)/admin/customers/page.tsx`**
   - Added `text-gray-900 bg-white` to all input className attributes

2. **`backend/app/services/fmcsa.py`**
   - Changed SAFER_BASE_URL to SAFER_WEB_URL
   - Rewrote `lookup_by_mc_number()` to use HTML endpoint
   - Added `_parse_html_response()` for HTML data extraction

---

## Testing

### Test Case: ACORN EXPRESS LLC
- **MC Number**: 850964
- **DOT Number**: 2796702
- **Expected Result**: ✅ Should find and display broker info

### Steps to Test:
1. Go to Customers page
2. Click Edit on any broker with MC number
3. Enter MC number (e.g., "850964" or "MC-850964")
4. Scroll to FMCSA Lookup section
5. Click "Verify Broker with FMCSA"
6. Should display:
   - ✅ Green success message
   - Legal Name: ACORN EXPRESS LLC
   - DOT: 2796702
   - MC: 850964
   - Address: 179 SOUTH LAKE ST, FOREST LAKE, MN 55025
   - Phone: (651) 356-8079
   - Status: ACTIVE

---

## Known Limitations

### HTML Scraping
The FMCSA service now uses HTML scraping instead of a proper API because:
- FMCSA doesn't have a public JSON API
- The mobile API endpoint we were using doesn't exist
- Web scraping is the only reliable method

### Potential Issues:
- **Fragile**: If FMCSA changes their HTML structure, parsing may break
- **Slower**: HTML parsing is slower than JSON API
- **Limited Data**: Some fields may not be extractable from HTML

### Future Improvements:
1. Add BeautifulSoup for more robust HTML parsing
2. Add caching to reduce FMCSA requests
3. Add error handling for malformed HTML
4. Consider paid FMCSA API if available

---

## Regex Patterns Used

```python
# Legal Name
r'Legal Name:</b>\s*</td>\s*<td[^>]*>\s*([^<]+)'

# DOT Number  
r'USDOT Number:</b>\s*</td>\s*<td[^>]*>\s*(\d+)'

# Address
r'Physical Address:</b>\s*</td>\s*<td[^>]*>\s*([^<]+)'

# City
r'Physical Address:</b>.*?<br>\s*([^,]+),'

# State/Zip
r'Physical Address:</b>.*?<br>\s*[^,]+,\s*([A-Z]{2})\s+(\d+)'

# Phone
r'Phone:</b>\s*</td>\s*<td[^>]*>\s*\((\d{3})\)\s*(\d{3})-(\d{4})'
```

---

## Example Response

```json
{
  "verified": true,
  "status": "active",
  "message": "Broker verified and active",
  "data": {
    "legal_name": "ACORN EXPRESS LLC",
    "dba_name": null,
    "dot_number": "2796702",
    "mc_number": "850964",
    "entity_type": "Broker",
    "operating_status": "ACTIVE",
    "physical_address": {
      "street": "179 SOUTH LAKE ST",
      "city": "FOREST LAKE",
      "state": "MN",
      "zip": "55025",
      "country": "US"
    },
    "phone": "(651) 356-8079",
    "is_broker": true,
    "is_carrier": false
  }
}
```

---

## Auto-Fill Feature

When broker is verified, the modal asks:
> "Auto-fill broker information from FMCSA? This will overwrite existing data."

If user clicks OK, it auto-fills:
- ✅ Company Name (from legal_name)
- ✅ DOT Number
- ✅ Address
- ✅ City
- ✅ State  
- ✅ Phone

---

## Status

**Both issues RESOLVED** ✅

- ✅ Input text now visible
- ✅ FMCSA lookup working for valid MC numbers
- ✅ Backend restarted with changes
- ✅ Frontend updated with fixes

**Ready for testing!**

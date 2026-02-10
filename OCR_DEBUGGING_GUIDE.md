# 🔍 OCR Debugging & Testing Guide

## Issue Identified
The OCR extraction shows 90% confidence but fields are not being populated in the form.

## Changes Made

### 1. **Added Console Logging**
The modal now logs to browser console:
- Full API response
- Extracted fields object
- Form population values

### 2. **Fixed Data Mapping**
Changed from `data.data || {}` to `data.data || data` to handle both response formats.

### 3. **Added Debug Panel**
A collapsible "View Extracted Data (Debug)" section shows the raw JSON response.

---

## Testing Steps

### **Step 1: Open Browser Console**
1. Open `http://localhost:3001`
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Keep it open during testing

### **Step 2: Upload Rate Confirmation**
1. Click "New shipment" button
2. Select "AI Extraction"
3. Upload your rate confirmation file
4. Watch the console for logs

### **Step 3: Check Console Output**
You should see three log messages:
```
Extracted data from API: { ... }
Extracted fields: { ... }
Form populated with: { loadNumber: "...", pickup: "...", ... }
```

### **Step 4: Expand Debug Panel**
In the modal, click "View Extracted Data (Debug)" to see the full JSON response.

---

## What to Look For

### **In Console Logs:**

#### **Log 1: "Extracted data from API"**
This shows the raw API response. Check:
- Is there a `data` property?
- Is `overall_confidence` present?
- What's the structure?

Expected structure:
```json
{
  "data": {
    "load_number": "ABC123",
    "broker_name": "XYZ Logistics",
    "mc_number": "123456",
    "rate_amount": "1500",
    "po_number": "PO-789",
    "addresses": [
      {
        "full_address": "123 Main St, City, ST 12345",
        "company": "Pickup Company",
        ...
      },
      {
        "full_address": "456 Oak Ave, Town, ST 67890",
        "company": "Delivery Company",
        ...
      }
    ]
  },
  "overall_confidence": 0.9,
  "raw_text": "..."
}
```

#### **Log 2: "Extracted fields"**
This shows what fields were extracted. Check:
- Are the field names correct? (`load_number`, `broker_name`, etc.)
- Are the values present?
- Are they strings or other types?

#### **Log 3: "Form populated with"**
This shows what values were set in the form. Check:
- Are values `undefined` or empty strings?
- Do they match the extracted fields?

---

## Common Issues & Fixes

### **Issue 1: Fields are `undefined`**
**Cause**: Field names in API response don't match expected names.

**Fix**: Check the actual field names in the API response and update the mapping.

Example:
```typescript
// If API returns "loadNumber" instead of "load_number"
loadNumber: extracted.loadNumber || extracted.load_number || "",
```

### **Issue 2: `addresses` array is empty**
**Cause**: Address extraction pattern didn't match.

**Fix**: Check the `raw_text` in the debug panel to see what text was extracted. The OCR service might need pattern improvements.

### **Issue 3: Confidence is high but no data**
**Cause**: OCR extracted text but patterns didn't match.

**Fix**: Look at `raw_text` in the response and compare with the regex patterns in `backend/app/services/rate_con_ocr.py`.

---

## Next Steps After Testing

### **If Console Shows Correct Data:**
The issue is in the form state management. We'll need to check React state updates.

### **If Console Shows Empty/Wrong Data:**
The issue is in the backend OCR extraction. We'll need to:
1. Check the `raw_text` to see what Tesseract extracted
2. Improve the regex patterns in `rate_con_ocr.py`
3. Add more pattern variations

### **If No Console Logs Appear:**
The API call might be failing. Check:
1. Network tab in browser DevTools
2. Backend container logs: `docker-compose logs backend`
3. CORS or authentication issues

---

## Useful Commands

### **View Backend Logs:**
```powershell
docker-compose logs -f backend
```

### **View Frontend Logs:**
```powershell
docker-compose logs -f frontend
```

### **Restart Services:**
```powershell
docker-compose restart frontend backend
```

### **Check API Directly:**
You can test the OCR endpoint directly using curl or Postman:
```bash
curl -X POST http://localhost:8000/loads/parse-rate-con \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@path/to/rate-confirmation.pdf"
```

---

## Expected Behavior After Fix

1. Upload rate confirmation
2. See "Data Extracted Successfully - Confidence: 90%"
3. Click "View Extracted Data (Debug)" to see raw JSON
4. Form fields should be pre-filled:
   - Load Number
   - Broker Name
   - Pickup Address
   - Delivery Address
   - PO Number
   - Notes (with broker, MC, rate info)
5. Review and edit if needed
6. Click "Create Load"
7. Load appears in dashboard

---

## Sample Rate Confirmation for Testing

If you need a test document, create a simple text file with this content:

```
RATE CONFIRMATION

Load Number: TEST-12345
Broker: ABC Logistics LLC
MC #: 123456
DOT #: 789012

Pickup Date: 02/08/2026
Pickup Location:
Warehouse Inc
123 Industrial Blvd
Chicago, IL 60601

Delivery Date: 02/10/2026
Delivery Location:
Distribution Center
456 Commerce Dr
Dallas, TX 75201

PO Number: PO-98765
Rate: $2,500.00
```

Save as PDF or take a screenshot and save as PNG/JPG.

---

*Once we see the console logs, we'll know exactly where the issue is and can fix it quickly!*

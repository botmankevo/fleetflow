# ✅ MainTMS Testing Checklist - February 7, 2026

## 🎯 **PRE-DEPLOYMENT TESTING**

Before deploying to AWS, let's verify everything works perfectly locally.

---

## 📊 **SYSTEM STATUS**

### Services Running:
- ✅ PostgreSQL Database (Port 5432) - Healthy, 28h uptime
- ✅ Backend API (Port 8000) - Running, 30m uptime
- ✅ Frontend (Port 3001) - Running, 2h uptime

### Data Loaded:
- ✅ Users: 1 (admin@coxtnl.com)
- ✅ Customers: 155 (100 brokers + 55 shippers)
- ✅ Loads: 603 historical records
- ✅ Vendors: Ready to add
- ✅ Equipment: Ready to add

---

## 🧪 **TEST PLAN**

### **Phase 1: Basic Functionality (10 minutes)**

#### Test 1.1: Login & Authentication ✅
**Steps**:
1. Open http://localhost:3001
2. Login with: `admin@coxtnl.com` / `admin123`
3. Verify redirect to dashboard
4. Check if username appears in header

**Expected**: 
- ✅ Login successful
- ✅ Dashboard loads
- ✅ User info displayed

**Status**: [ ] PASS [ ] FAIL

---

#### Test 1.2: Customers Page (155 records) ✅
**Steps**:
1. Navigate to `/admin/customers`
2. Verify 155 customers loaded
3. Search for "CH Robinson"
4. Filter by "broker" type
5. Click on a customer to view details

**Expected**:
- ✅ All 155 customers visible
- ✅ Search works
- ✅ Filters work
- ✅ Customer details load

**Status**: [ ] PASS [ ] FAIL

---

#### Test 1.3: Loads Page (603 records) ✅
**Steps**:
1. Navigate to `/admin/loads`
2. Verify 603 loads visible
3. Check if loads show customer names
4. Sort by different columns
5. Filter by status

**Expected**:
- ✅ All 603 loads visible
- ✅ Customer names linked
- ✅ Sorting works
- ✅ Filtering works

**Status**: [ ] PASS [ ] FAIL

---

### **Phase 2: New Features Built Today (15 minutes)**

#### Test 2.1: IFTA Management 🆕
**Steps**:
1. Navigate to `/admin/ifta`
2. Click "+ New Quarterly Report"
3. Select Q1 2026
4. Create report
5. Click "Add Entry"
6. Enter: TX, 500 miles, 100 gallons
7. Save entry
8. Verify calculations (MPG = 5.0)

**Expected**:
- ✅ Report created
- ✅ Entry added
- ✅ MPG calculated automatically
- ✅ Summary table shows TX data

**Status**: [ ] PASS [ ] FAIL

---

#### Test 2.2: Safety & Compliance 🆕
**Steps**:
1. Navigate to `/admin/safety`
2. Click "+ Report Safety Event"
3. Fill in:
   - Event type: Violation
   - Date: Today
   - Severity: Medium
   - Description: "Test violation"
4. Create event
5. Verify it appears in list
6. Click "View" to see details
7. Mark as "Resolved"

**Expected**:
- ✅ Event created
- ✅ Appears in events list
- ✅ Details modal works
- ✅ Status update works
- ✅ Stats dashboard updates

**Status**: [ ] PASS [ ] FAIL

---

#### Test 2.3: Tolls Management 🆕
**Steps**:
1. Navigate to `/admin/tolls`
2. Click "Transponders" tab
3. Click "+ Add Transponder"
4. Fill in:
   - Number: TEST-12345
   - Provider: EZPass
   - Activation date: Today
   - Balance: $50.00
5. Create transponder
6. Switch to "Transactions" tab
7. Click "+ Add Transaction"
8. Fill in:
   - Date: Today
   - Authority: EZPass
   - Location: Ohio Turnpike
   - Amount: $5.50
9. Create transaction
10. Click "Verify" on transaction

**Expected**:
- ✅ Transponder created
- ✅ Shows in list with $50 balance
- ✅ Transaction created
- ✅ Status changes to "verified"
- ✅ Stats update

**Status**: [ ] PASS [ ] FAIL

---

#### Test 2.4: Vendor Management 🆕
**Steps**:
1. Navigate to `/admin/vendors`
2. Click "+ Add Vendor"
3. Fill in:
   - Name: "Joe's Truck Repair"
   - Type: Repair Shop
   - Contact: "Joe Smith"
   - Phone: "555-1234"
   - City: "Columbus"
   - State: "OH"
   - Payment Terms: NET30
   - Preferred: ✓
   - Rating: 5 stars
4. Save vendor
5. Verify it appears in list with ⭐
6. Edit vendor and change rating to 4
7. Filter by "repair_shop"

**Expected**:
- ✅ Vendor created
- ✅ Shows in list with preferred badge
- ✅ Edit works
- ✅ Filter works
- ✅ Star rating displays

**Status**: [ ] PASS [ ] FAIL

---

#### Test 2.5: Expenses (Enhanced) 🆕
**Steps**:
1. Navigate to `/admin/expenses`
2. Click "+ Add Expense"
3. Fill in:
   - Date: Today
   - Category: Repairs
   - Amount: $250.00
   - Vendor: Select "Joe's Truck Repair"
   - Description: "Brake service"
4. Create expense
5. Verify status is "Pending"
6. Click "Approve"
7. Verify status changes to "Approved"
8. Check stats dashboard updates

**Expected**:
- ✅ Expense created with vendor
- ✅ Status is pending
- ✅ Approval works
- ✅ Stats update
- ✅ Vendor shows in table

**Status**: [ ] PASS [ ] FAIL

---

### **Phase 3: Core Features (10 minutes)**

#### Test 3.1: Create New Load
**Steps**:
1. Navigate to `/admin/loads`
2. Click "+ New Load"
3. Fill in:
   - Load number: TEST-001
   - Customer: Select existing customer
   - Pickup: "Dallas, TX"
   - Delivery: "Chicago, IL"
   - Rate: $1500
   - Distance: 1000 miles
4. Save load
5. Verify it appears in loads list

**Expected**:
- ✅ Load created
- ✅ Customer linked
- ✅ Shows in list

**Status**: [ ] PASS [ ] FAIL

---

#### Test 3.2: Drivers Page
**Steps**:
1. Navigate to `/admin/drivers`
2. Click "+ Add Driver"
3. Fill in:
   - Name: "Test Driver"
   - Email: "test@example.com"
   - Phone: "555-0000"
   - License: "ABC123"
4. Save driver
5. Verify driver appears

**Expected**:
- ✅ Driver created
- ✅ Shows in list

**Status**: [ ] PASS [ ] FAIL

---

#### Test 3.3: Dispatch Board
**Steps**:
1. Navigate to `/admin/dispatch`
2. View loads and drivers
3. Test drag-and-drop if applicable
4. Check load assignment

**Expected**:
- ✅ Page loads
- ✅ Loads visible
- ✅ Drivers visible

**Status**: [ ] PASS [ ] FAIL

---

#### Test 3.4: Payroll
**Steps**:
1. Navigate to `/admin/payroll`
2. View settlements
3. Check pay profiles
4. Verify calculations

**Expected**:
- ✅ Page loads
- ✅ Data displays correctly

**Status**: [ ] PASS [ ] FAIL

---

### **Phase 4: Driver Portal (5 minutes)**

#### Test 4.1: Driver Login
**Steps**:
1. Open http://localhost:3001/driver
2. Try to login with driver credentials
3. View assigned loads
4. Check POD submission

**Expected**:
- ✅ Driver portal loads
- ✅ Login works (if driver exists)
- ✅ Mobile-friendly

**Status**: [ ] PASS [ ] FAIL

---

### **Phase 5: API Testing (5 minutes)**

#### Test 5.1: Backend API Documentation
**Steps**:
1. Open http://localhost:8000/docs
2. View all endpoints
3. Try "Test" endpoint (if available)
4. Check authentication

**Expected**:
- ✅ Swagger docs load
- ✅ All 29 routers visible
- ✅ 150+ endpoints listed

**Status**: [ ] PASS [ ] FAIL

---

#### Test 5.2: API Login Test
**PowerShell Test**:
```powershell
$body = @{email="admin@coxtnl.com"; password="admin123"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/auth/login" -Method Post -Body $body -ContentType "application/json"
```

**Expected**:
- ✅ Returns access_token
- ✅ No errors

**Status**: [ ] PASS [ ] FAIL

---

#### Test 5.3: Get Customers API
**PowerShell Test**:
```powershell
$token = "[YOUR_TOKEN_FROM_ABOVE]"
Invoke-RestMethod -Uri "http://localhost:8000/customers/" -Headers @{Authorization="Bearer $token"}
```

**Expected**:
- ✅ Returns 155 customers
- ✅ JSON format correct

**Status**: [ ] PASS [ ] FAIL

---

### **Phase 6: Mobile/Responsive Testing (5 minutes)**

#### Test 6.1: Mobile Browser
**Steps**:
1. Open http://192.168.208.1:3001 on phone
2. Login
3. Navigate pages
4. Test driver portal

**Expected**:
- ✅ Loads on mobile
- ✅ Responsive design works
- ✅ Touch controls work

**Status**: [ ] PASS [ ] FAIL

---

### **Phase 7: Performance Testing (5 minutes)**

#### Test 7.1: Page Load Times
**Steps**:
1. Clear browser cache
2. Time each page load:
   - Login: [ ]s
   - Dashboard: [ ]s
   - Customers: [ ]s
   - Loads: [ ]s
   - IFTA: [ ]s

**Expected**:
- ✅ All pages < 3 seconds
- ✅ No errors in console

**Status**: [ ] PASS [ ] FAIL

---

#### Test 7.2: Large Data Handling
**Steps**:
1. Load customers page (155 records)
2. Scroll through all records
3. Use search/filter
4. Check memory usage

**Expected**:
- ✅ Smooth scrolling
- ✅ Search is fast
- ✅ No browser lag

**Status**: [ ] PASS [ ] FAIL

---

## 📋 **AUTOMATED TEST SCRIPT**

### Quick Test Script:
```powershell
# Save as test_maintms.ps1

cd "C:\Users\my self\.gemini\antigravity\scratch\MainTMS"

Write-Host "🧪 MainTMS Testing Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Test 1: Services Running
Write-Host "`n1. Checking services..." -ForegroundColor Yellow
$services = docker-compose ps --services --filter "status=running"
if ($services.Count -eq 3) {
    Write-Host "✅ All 3 services running" -ForegroundColor Green
} else {
    Write-Host "❌ Some services down" -ForegroundColor Red
}

# Test 2: Database Connection
Write-Host "`n2. Testing database..." -ForegroundColor Yellow
$dbTest = docker-compose exec -T db psql -U main_tms -d main_tms -c "SELECT COUNT(*) FROM customers;" 2>&1
if ($dbTest -match "155") {
    Write-Host "✅ Database accessible, 155 customers found" -ForegroundColor Green
} else {
    Write-Host "❌ Database issue" -ForegroundColor Red
}

# Test 3: Backend API
Write-Host "`n3. Testing backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend API responding" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend API not responding" -ForegroundColor Red
}

# Test 4: Frontend
Write-Host "`n4. Testing frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend responding" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend not responding" -ForegroundColor Red
}

# Test 5: Login API
Write-Host "`n5. Testing login..." -ForegroundColor Yellow
try {
    $body = @{email="admin@coxtnl.com"; password="admin123"} | ConvertTo-Json
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8000/auth/login" -Method Post -Body $body -ContentType "application/json"
    if ($loginResponse.access_token) {
        Write-Host "✅ Login successful, token received" -ForegroundColor Green
        $global:token = $loginResponse.access_token
    }
} catch {
    Write-Host "❌ Login failed" -ForegroundColor Red
}

# Test 6: Customers API
Write-Host "`n6. Testing customers API..." -ForegroundColor Yellow
try {
    $customers = Invoke-RestMethod -Uri "http://localhost:8000/customers/" -Headers @{Authorization="Bearer $global:token"}
    Write-Host "✅ Retrieved $($customers.Count) customers" -ForegroundColor Green
} catch {
    Write-Host "❌ Customers API failed" -ForegroundColor Red
}

# Test 7: Loads API
Write-Host "`n7. Testing loads API..." -ForegroundColor Yellow
try {
    $loads = Invoke-RestMethod -Uri "http://localhost:8000/loads/" -Headers @{Authorization="Bearer $global:token"}
    Write-Host "✅ Retrieved $($loads.Count) loads" -ForegroundColor Green
} catch {
    Write-Host "❌ Loads API failed" -ForegroundColor Red
}

# Test 8: New Features
Write-Host "`n8. Testing new features..." -ForegroundColor Yellow
try {
    $vendors = Invoke-RestMethod -Uri "http://localhost:8000/vendors/" -Headers @{Authorization="Bearer $global:token"}
    Write-Host "✅ Vendors API working ($($vendors.Count) vendors)" -ForegroundColor Green
} catch {
    Write-Host "❌ Vendors API failed" -ForegroundColor Red
}

Write-Host "`n=========================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "`nManual tests required:" -ForegroundColor Yellow
Write-Host "  - Open http://localhost:3001" -ForegroundColor White
Write-Host "  - Test IFTA, Safety, Tolls pages" -ForegroundColor White
Write-Host "  - Create test records" -ForegroundColor White
Write-Host "  - Verify mobile responsiveness" -ForegroundColor White
```

**Run it**:
```powershell
cd "C:\Users\my self\.gemini\antigravity\scratch\MainTMS"
# Copy script above and run
```

---

## ✅ **TESTING SUMMARY**

### Tests to Complete:
- [ ] Phase 1: Basic Functionality (10 min)
- [ ] Phase 2: New Features (15 min)
- [ ] Phase 3: Core Features (10 min)
- [ ] Phase 4: Driver Portal (5 min)
- [ ] Phase 5: API Testing (5 min)
- [ ] Phase 6: Mobile Testing (5 min)
- [ ] Phase 7: Performance (5 min)

**Total Time**: ~1 hour

---

## 🎯 **RECOMMENDATION**

**Do this now**:
1. Run the automated test script (5 minutes)
2. Manually test the 5 new features (10 minutes)
3. Browse through your 155 customers and 603 loads (5 minutes)
4. Create one test IFTA entry, safety event, and vendor (5 minutes)

**Then you'll be confident to deploy!**

---

**Ready to test?** Let me know which phase you want to start with, or I can create the automated test script for you!

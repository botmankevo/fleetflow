# Main TMS - Testing Guide 🧪

## 🚀 Quick Start - Get It Running

### Prerequisites Checklist:
- [ ] **Docker Desktop** - Running and started
- [ ] **10GB+ free disk space** - For containers
- [ ] **Mapbox API Key** - Sign up at https://mapbox.com (free tier)
- [ ] **Terminal/PowerShell** - Admin access

---

## 📋 Step-by-Step Setup

### Step 1: Free Up Disk Space (If Needed)

Check available space:
```powershell
Get-PSDrive C | Select-Object Used,Free
```

If low on space, clean up:
```powershell
# Clean Docker (if needed)
docker system prune -a --volumes

# Or use Windows Disk Cleanup
cleanmgr
```

---

### Step 2: Get Mapbox API Token

1. Go to https://account.mapbox.com/
2. Sign up or log in (free account)
3. Copy your **Default Public Token**
4. Save it for Step 4

---

### Step 3: Navigate to Project

```powershell
cd "C:\Users\my self\.gemini\antigravity\scratch\fleetflow"
```

---

### Step 4: Configure Environment Variables

#### Backend `.env`:
Create `backend/.env` file:

```env
# Database
DATABASE_URL=postgresql+psycopg2://fleetflow:fleetflow@db:5432/fleetflow
POSTGRES_DB=fleetflow
POSTGRES_USER=fleetflow
POSTGRES_PASSWORD=fleetflow

# JWT
JWT_SECRET=your-secret-key-change-in-production
TOKEN_EXP_MINUTES=1440

# Environment
FLEETFLOW_ENV=dev
DEBUG=true

# Mapbox (REQUIRED - Get from mapbox.com)
MAPBOX_API_KEY=pk.your_actual_mapbox_token_here

# Optional
FMCSA_API_KEY=
DROPBOX_ACCESS_TOKEN=
DROPBOX_ROOT_FOLDER=/MainTMS
GOOGLE_MAPS_API_KEY=

# Feature Flags
ENABLE_AIRTABLE=false
ENABLE_DROPBOX=true
ENABLE_GOOGLE_MAPS=false
ENABLE_MAPBOX=true
```

#### Frontend `.env.local`:
Create `frontend/.env.local` file:

```env
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_actual_mapbox_token_here
```

**⚠️ IMPORTANT: Replace `pk.your_actual_mapbox_token_here` with your real token!**

---

### Step 5: Install Dependencies

#### Option A: Using Docker (Recommended - Skip to Step 6)
Docker will install everything automatically.

#### Option B: Manual Installation (If not using Docker)

**Backend:**
```powershell
cd backend
pip install -r requirements.txt
```

**Frontend:**
```powershell
cd frontend
npm install
```

---

### Step 6: Run Database Migrations

This creates all the new tables (customers, invoices, etc.):

```powershell
cd backend
alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Running upgrade ...
INFO  [alembic.runtime.migration] Running upgrade ... -> add_mapbox_broker_fields
INFO  [alembic.runtime.migration] Running upgrade ... -> add_customers_table
INFO  [alembic.runtime.migration] Running upgrade ... -> add_invoices_tables
```

---

### Step 7: Start the Services

#### Option A: Docker (Recommended)

```powershell
# Make sure Docker Desktop is running first!
docker-compose up -d
```

Wait 30-60 seconds for services to start.

Check status:
```powershell
docker-compose ps
```

Should show:
- `fleetflow-backend-1` - running
- `fleetflow-frontend-1` - running
- `fleetflow-db-1` - running

View logs:
```powershell
# All services
docker-compose logs -f

# Just backend
docker-compose logs -f backend

# Just frontend
docker-compose logs -f frontend
```

#### Option B: Manual Start (Without Docker)

**Terminal 1 - Backend:**
```powershell
cd backend
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

---

### Step 8: Access Your Main TMS! 🎉

Open your browser:

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🧪 Testing Checklist

### 1. Test Login Page
- [ ] Navigate to http://localhost:3001
- [ ] See the login page
- [ ] Beautiful Main TMS logo visible

### 2. Create Test User (First Time)

Use API docs: http://localhost:8000/docs

1. Find `POST /auth/register`
2. Click "Try it out"
3. Enter:
```json
{
  "email": "admin@maintms.com",
  "password": "admin123",
  "full_name": "Admin User",
  "role": "platform_owner"
}
```
4. Click "Execute"
5. Copy the `access_token` from response

### 3. Login
- [ ] Go back to http://localhost:3001
- [ ] Login with: admin@maintms.com / admin123
- [ ] Should redirect to dashboard

### 4. Test Dispatch Board ⭐
- [ ] Go to **Dispatch** page
- [ ] See Kanban board with 4 columns
- [ ] See stat cards at top (available loads, drivers, etc.)
- [ ] Try dragging a load between columns (if you have test data)
- [ ] Click "Assign Driver" on a load
- [ ] See available drivers modal
- [ ] Animations are smooth

### 5. Test Customer Management ⭐
- [ ] Go to **Customers** page
- [ ] Click "+ Add Customer"
- [ ] Fill in customer details:
  - Company Name: "Test Broker LLC"
  - MC Number: "123456"
  - City: "Dallas"
  - State: "TX"
  - Payment Terms: "Net 30"
- [ ] **Try FMCSA verification** (if you entered real MC number)
- [ ] Click "Create"
- [ ] See customer card appear
- [ ] Card shows stats (loads, revenue)
- [ ] Click "Edit" - modal opens
- [ ] Click "View" - goes to detail page

### 6. Test Loads & Mapping ⭐
- [ ] Go to **Loads** page
- [ ] Click "+ Create Load"
- [ ] Fill in load details
- [ ] **Try address autocomplete** (start typing address)
- [ ] Should see suggestions
- [ ] Save load
- [ ] Click on load to view details
- [ ] Should see map with route
- [ ] Should see **color-coded rate per mile** badge
- [ ] Should see mileage between stops

### 7. Test Invoicing ⭐
- [ ] Go to **Accounting** page
- [ ] See invoice dashboard
- [ ] Click "+ Create Invoice"
- [ ] Select customer
- [ ] Select delivered loads
- [ ] See total amount calculate
- [ ] Click "Create Invoice"
- [ ] See invoice card appear
- [ ] Click "View Details"
- [ ] See line items
- [ ] Try "Record Payment"
- [ ] Enter payment amount
- [ ] Click "Record"
- [ ] Balance updates

### 8. Test Document Generation ⭐
- [ ] Go to a load detail page
- [ ] Look for "Generate Rate Confirmation" button
- [ ] Click it
- [ ] PDF should download
- [ ] Open PDF - see professional rate con
- [ ] Try "Generate BOL"
- [ ] PDF downloads
- [ ] Open PDF - see bill of lading

### 9. Test UI/UX Enhancements ✨
- [ ] Hover over cards - see lift effect
- [ ] Click buttons - see ripple effect
- [ ] Check scrollbar - themed green
- [ ] Open modals - see blur backdrop
- [ ] Try on mobile/tablet (responsive)
- [ ] Animations are smooth
- [ ] Toast notifications work (try creating something)

### 10. Test Mobile View 📱
- [ ] Open on phone or resize browser to mobile
- [ ] All buttons are easy to tap (44px minimum)
- [ ] Modals fit on screen
- [ ] Tables scroll horizontally
- [ ] Forms are easy to fill
- [ ] Navigation works

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot connect to database"
**Fix:**
```powershell
# Restart Docker containers
docker-compose restart db

# Or rebuild
docker-compose down
docker-compose up -d
```

### Issue: "Mapbox maps not showing"
**Fix:**
1. Check that `NEXT_PUBLIC_MAPBOX_TOKEN` is set in `frontend/.env.local`
2. Check that `MAPBOX_API_KEY` is set in `backend/.env`
3. Verify token is valid at https://account.mapbox.com/
4. Restart frontend:
```powershell
docker-compose restart frontend
```

### Issue: "Address autocomplete not working"
**Fix:**
- Same as above - check Mapbox token
- Check browser console for errors (F12)

### Issue: "FMCSA verification fails"
**Fix:**
- FMCSA API is rate-limited (public endpoint)
- Try with a real MC number
- Check internet connection
- It's optional - you can skip this

### Issue: "Port already in use"
**Fix:**
```powershell
# Find what's using port 3001 or 8000
netstat -ano | findstr :3001
netstat -ano | findstr :8000

# Kill the process (replace PID with actual number)
taskkill /PID [PID] /F
```

### Issue: "Docker out of disk space"
**Fix:**
```powershell
# Clean up Docker
docker system prune -a --volumes

# This will free up space
```

### Issue: "Migrations fail"
**Fix:**
```powershell
# Reset database (WARNING: Deletes all data)
docker-compose down -v
docker-compose up -d
cd backend
alembic upgrade head
```

### Issue: "Frontend won't load"
**Fix:**
```powershell
cd frontend
rm -rf .next
npm run build
npm run dev
```

---

## 📊 Test Data Creation

### Quick Test Data Script:

Use the API docs (http://localhost:8000/docs) to create:

1. **Create a Driver:**
   - `POST /drivers/`
   - First name: "John"
   - Last name: "Driver"
   - Phone: "555-1234"

2. **Create a Customer:**
   - `POST /customers/`
   - Company: "ABC Logistics"
   - MC: "123456"

3. **Create a Load:**
   - `POST /loads/`
   - Load number: "LOAD-001"
   - Pickup: "Dallas, TX"
   - Delivery: "Houston, TX"
   - Rate: 1500
   - Customer: "ABC Logistics"

4. **Assign Load to Driver:**
   - Go to Dispatch Board
   - Drag load to "Assigned"
   - Or click "Assign Driver"

---

## 🎯 What to Test

### Priority 1 (Must Test):
1. ✅ Dispatch board drag-and-drop
2. ✅ Customer creation with FMCSA
3. ✅ Invoice creation and payment
4. ✅ Load mapping with routes
5. ✅ Document PDF generation

### Priority 2 (Should Test):
1. ✅ Address autocomplete
2. ✅ Color-coded rate per mile
3. ✅ Search and filters
4. ✅ Mobile responsiveness
5. ✅ Toast notifications

### Priority 3 (Nice to Test):
1. ✅ All animations
2. ✅ Hover effects
3. ✅ Loading states
4. ✅ Empty states
5. ✅ Error handling

---

## 📸 What to Look For

### ✨ Beautiful UI:
- Smooth animations
- Green-themed design
- Professional appearance
- Consistent spacing
- Clear typography

### 🚀 Functionality:
- Everything works
- No errors in console
- Fast responses
- Intuitive flows

### 📱 Mobile:
- Works on phone
- Easy to tap
- Readable text
- Proper layout

### ♿ Accessibility:
- Keyboard navigation works
- Focus states visible
- Contrast is good
- Screen reader friendly (if testing)

---

## 📝 Feedback Form

After testing, note:

### What Works Well:
- 

### What Needs Improvement:
- 

### Bugs Found:
- 

### Feature Requests:
- 

### Overall Impression:
- 

---

## 🎉 Next Steps After Testing

1. **If everything works:**
   - ✅ Celebrate! 🎊
   - ✅ Start using with partner company
   - ✅ Gather feedback
   - ✅ Make improvements

2. **If issues found:**
   - 📝 List issues
   - 🔧 We can fix them together
   - 🧪 Test again

3. **When ready:**
   - 🚀 Deploy to production
   - 💰 Start selling to other carriers
   - 📈 Scale your business!

---

## 💡 Tips for Testing

1. **Use multiple browser tabs** - Open dispatch, customers, loads
2. **Try keyboard navigation** - Tab through forms
3. **Resize browser** - Test responsive design
4. **Clear cache** if something looks wrong - Ctrl+Shift+R
5. **Check console** for errors - F12 → Console tab
6. **Take screenshots** of any issues

---

## 🆘 Need Help?

If you run into issues:

1. **Check the logs:**
```powershell
docker-compose logs -f
```

2. **Check browser console:**
   - Press F12
   - Go to Console tab
   - Look for errors

3. **Restart services:**
```powershell
docker-compose restart
```

4. **Full reset:**
```powershell
docker-compose down
docker-compose up -d
```

5. **Ask me!** I'm here to help fix any issues!

---

**Ready to test? Let's go!** 🚀

Start with Step 1: Check your disk space and Docker Desktop status!

# 🚀 How to Start MainTMS

**Quick Start Guide**

---

## ⚡ QUICK START (2 Commands)

### 1. Start Backend (First Terminal)
```bash
cd C:\Users\my self\.gemini\antigravity\scratch\MainTMS\backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start Frontend (Second Terminal)
```bash
cd C:\Users\my self\.gemini\antigravity\scratch\MainTMS\frontend
npm run dev
```

### 3. Open Browser
```
http://localhost:3000
```

---

## 📋 STEP-BY-STEP

### Step 1: Start Backend
1. Open PowerShell/Terminal
2. Navigate to backend folder:
   ```bash
   cd C:\Users\my self\.gemini\antigravity\scratch\MainTMS\backend
   ```
3. Start the backend server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
4. Wait for: `Application startup complete`
5. Backend will run on: `http://127.0.0.1:8000`

### Step 2: Start Frontend
1. Open **NEW** PowerShell/Terminal window
2. Navigate to frontend folder:
   ```bash
   cd C:\Users\my self\.gemini\antigravity\scratch\MainTMS\frontend
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Wait for: `✓ Ready in XXXms`
5. Frontend will run on: `http://localhost:3000`

### Step 3: Open in Browser
1. Open your browser
2. Go to: `http://localhost:3000`
3. Click **Customers** in sidebar
4. See your **846 real customers**!

---

## ✅ VERIFICATION

### Backend is Running:
- PowerShell shows: `Application startup complete`
- Visit: http://127.0.0.1:8000/docs
- Should see Swagger API documentation

### Frontend is Running:
- PowerShell shows: `✓ Ready in XXXms`
- Visit: http://localhost:3000
- Should see MainTMS dashboard

### Connected:
- Customers page shows **846 customers**
- No "No customers found" message
- Can click on customers to see details

---

## 🐛 TROUBLESHOOTING

### "No customers found" on Customers Page:
**Problem:** Backend not running  
**Solution:** Start backend first (Step 1 above)

### "404: This page could not be found":
**Problem:** Frontend build error  
**Solution:** 
```bash
cd frontend
rm -rf .next
npm run dev
```

### "Module not found" errors:
**Problem:** Missing dependencies  
**Solution:**
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Port Already in Use:
**Backend (Port 8000):**
```bash
# Find and kill process
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Frontend (Port 3000):**
```bash
# Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 📝 WHAT EACH SERVICE DOES

### Backend (Port 8000):
- Serves API endpoints
- Connects to database (846 customers)
- Handles authentication
- Processes business logic

### Frontend (Port 3000):
- User interface
- Connects to backend API
- Displays data
- Handles user interactions

---

## 🔗 IMPORTANT URLS

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | Main application |
| **Backend API** | http://127.0.0.1:8000 | API server |
| **API Docs** | http://127.0.0.1:8000/docs | Swagger UI |
| **Customers** | http://localhost:3000/admin/customers | View 846 customers |
| **QuickBooks** | http://localhost:3000/admin/quickbooks | QuickBooks integration |
| **Load Boards** | http://localhost:3000/admin/loadboards | Load board search |
| **Communications** | http://localhost:3000/admin/communications | Email/SMS |
| **Tracking** | http://localhost:3000/admin/tracking | GPS tracking |

---

## 💡 TIPS

1. **Always start backend FIRST**, then frontend
2. Keep both terminals open while using MainTMS
3. Backend will auto-reload when code changes
4. Frontend will auto-reload when code changes
5. Check terminals for errors if something breaks

---

## 🛑 STOPPING MAINTMS

### To Stop:
1. Go to each PowerShell window
2. Press `Ctrl + C`
3. Close the windows

### Or Kill All:
```powershell
# Kill all node processes (frontend)
Get-Process -Name node | Stop-Process -Force

# Kill all Python processes (backend)
Get-Process -Name python | Stop-Process -Force
```

---

## 🎯 QUICK COMMANDS

### Start Everything:
```powershell
# Terminal 1 - Backend
cd C:\Users\my self\.gemini\antigravity\scratch\MainTMS\backend
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd C:\Users\my self\.gemini\antigravity\scratch\MainTMS\frontend
npm run dev
```

### Check Status:
```powershell
# Check if backend is running
netstat -ano | findstr :8000

# Check if frontend is running
netstat -ano | findstr :3000
```

---

## ✅ SUCCESS CHECKLIST

After starting both services:
- [ ] Backend terminal shows "Application startup complete"
- [ ] Frontend terminal shows "✓ Ready"
- [ ] Can access http://localhost:3000
- [ ] Can access http://127.0.0.1:8000/docs
- [ ] Customers page shows 846 customers
- [ ] No build errors in terminals

---

**Once both services are running, your MainTMS is ready to use!** 🎉

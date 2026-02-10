# 🔧 Rebuild Instructions

## Current Situation

The code changes we made are on your local filesystem but not in the Docker containers:

**✅ Files Created Locally:**
- `frontend/components/MainTMSLogo.tsx` - Logo component
- `frontend/app/logo-styles.css` - Logo styling
- `backend/alembic/versions/20260205_062433_add_document_exchange.py` - Migration

**✅ Files Modified Locally:**
- `frontend/app/layout.tsx` - Imports logo styles
- `frontend/components/Sidebar.tsx` - Uses new logo
- `frontend/app/(auth)/login/page.tsx` - Uses new logo
- `backend/app/models.py` - DocumentExchange model
- `backend/app/routers/pod.py` - 3 new endpoints
- `backend/app/routers/loads.py` - 1 new endpoint
- `backend/app/routers/payroll.py` - 9 new endpoints
- `backend/app/schemas/pod.py` - New schemas
- `backend/app/schemas/payroll.py` - New schemas

**❌ Issue:** Docker containers still have old code

---

## Solution: Rebuild Containers

### Quick Rebuild (Recommended)

```powershell
cd "C:\Users\my self\.gemini\antigravity\scratch\maintms"

# Stop containers
docker-compose down

# Rebuild with no cache
docker-compose build --no-cache

# Start everything
docker-compose up -d

# Wait for services to start
Start-Sleep -Seconds 10

# Re-seed admin user
docker exec main-tms-backend python -m app.scripts.seed_user --email admin@coxtnl.com --password admin123 --role admin --carrier-name "Cox TNL" --carrier-code COXTNL

# Verify
docker ps
```

---

## After Rebuild - What You'll See

### ✅ Logo & Branding
- Login page shows MAIN TMS logo with gradient AI mark
- Sidebar shows full logo with glowing dot
- Hover effects work

### ✅ Loads Page
- 15 demo loads already created
- Full list view with all details

### ✅ Document Exchange
- Backend endpoints functional
- Frontend page ready (needs driver uploads to test)

### ✅ Payroll Page
- Will work after creating payees (currently empty)
- All endpoints functional

---

## Alternative: Quick Fix (Copy Files Method)

If you don't want to rebuild:

```powershell
# Copy logo files
docker cp frontend/app/logo-styles.css main-tms-frontend:/app/app/
docker cp frontend/components/MainTMSLogo.tsx main-tms-frontend:/app/components/

# Restart containers
docker restart main-tms-frontend
docker restart main-tms-backend
```

**Note:** This is less reliable and may miss dependencies.

---

## Test After Rebuild

1. **Test Login:** http://localhost:3001
   - Email: admin@coxtnl.com
   - Password: admin123

2. **Test Logo:** Should see MAIN TMS with AI mark

3. **Test API:** http://localhost:8000/docs
   - Check for new endpoints
   - Try document-exchange endpoints

4. **Test Loads:** Navigate to /admin/loads
   - Should see 15 demo loads

---

## If Issues Persist

Check logs:
```powershell
docker logs main-tms-backend --tail 50
docker logs main-tms-frontend --tail 50
```

Full reset:
```powershell
docker-compose down -v  # Remove volumes too
docker-compose build --no-cache
docker-compose up -d
# Re-seed data
```

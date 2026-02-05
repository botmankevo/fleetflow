# Manual Start Instructions

## Option 1: Use Simple Script (Easiest)

```powershell
.\START_SIMPLE.ps1
```

This opens two separate windows - one for backend, one for frontend.
Close both windows to stop services.

---

## Option 2: Use Individual Scripts

### Terminal 1 - Backend:
```powershell
.\start_backend.ps1
```

### Terminal 2 - Frontend:
```powershell
.\start_frontend.ps1
```

---

## Option 3: Manual Commands

### Terminal 1 - Backend:
```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

### Terminal 2 - Frontend:
```powershell
cd frontend
npm run dev
```

---

## First Time Setup

If database doesn't exist, run this first:

```powershell
cd backend
python -m alembic upgrade head
python -m app.scripts.seed_demo_data
```

---

## Login

- Email: admin@maintms.com
- Password: admin123

---

## URLs

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

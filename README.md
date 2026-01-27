# FleetFlow

FleetFlow is an internal trucking operations platform for Cox Transportation & Logistics.

## Stack
- FastAPI backend (Airtable + Dropbox + Google Maps)
- Next.js frontend (App Router + Tailwind)

## Run (Windows)
```powershell
# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (new terminal)
cd ..\frontend
copy .env.example .env.local
npm install
npm run dev
```

## Run (Mac/Linux)
```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (new terminal)
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

## Endpoints
- Health: http://127.0.0.1:8000/health
- Swagger: http://127.0.0.1:8000/docs

## Auth
- `POST /auth/dev-login` (email, role, carrier_code or carrier_record_id)
- `GET /auth/me` resolves driver_record_id by Driver Email + Carrier link

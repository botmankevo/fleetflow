# FleetFlow

FleetFlow is an internal trucking operations platform for Cox Transportation & Logistics.

## Stack
- FastAPI backend (Postgres + Dropbox + Google Maps)
- Next.js frontend (App Router + Tailwind)

## Run (Windows)
```powershell
# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
setx DATABASE_URL "postgresql+psycopg2://fleetflow:fleetflow@localhost:5432/fleetflow"
alembic upgrade head
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
export DATABASE_URL="postgresql+psycopg2://fleetflow:fleetflow@localhost:5432/fleetflow"
alembic upgrade head
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
- `POST /auth/login` (email, password)
- `POST /auth/dev-login` (email, role, carrier_code or carrier_id)
- `GET /auth/me` returns user/role/carrier context

## Seed Admin User
```bash
cd backend
python -m app.scripts.seed_user --email admin@fleetflow.app --password admin123 --role admin --carrier-code FF --carrier-name "FleetFlow"
```

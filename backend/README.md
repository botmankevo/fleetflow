# FleetFlow Backend

## Requirements
- Python 3.11+
- pip

## Setup (Windows)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Edit .env with your Airtable/Dropbox/Maps keys
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Setup (Mac/Linux)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Docs
- Swagger: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/health

## Auth
- `POST /auth/login` (email, password)
- `POST /auth/dev-login` (email, role, carrier_code or carrier_record_id)
- `GET /auth/me` resolves driver_record_id by Driver Email + Carrier link

## Airtable Users Table
Expected fields in the **Users** table:
- Email (single line text)
- Password (plain text or `pbkdf2$<salt>$<hash>` string)
- Role (admin | dispatcher | driver)
- Carrier (link to Carriers)

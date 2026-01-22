# FleetFlow Monorepo

FleetFlow is a simple internal dispatch portal with a FastAPI backend and a React (Vite) frontend.

## Repository Structure

```
/
  backend/
    app/
      core/
      routers/
      services/
    requirements.txt
    .env.example
    README.md
  frontend/
    src/
    package.json
    vite.config.*
    README.md
  README.md
```

## Backend (FastAPI)

### Create a virtual environment + install deps (Windows)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Configure environment

Copy `.env.example` to `.env` and fill in your values:

```powershell
copy .env.example .env
```

The backend loads env vars from `backend/.env` using `python-dotenv`.

### Run the backend

```powershell
python -m uvicorn app.main:app --reload
```

Swagger UI: http://127.0.0.1:8000/docs

### Windows troubleshooting

- **Activate venv:** `.\.venv\Scripts\Activate.ps1`
- **uvicorn missing:** `pip install -r requirements.txt`
- **.env location:** ensure `backend/.env` exists; the API loads it at startup.

## Frontend (React + Vite)

### Install dependencies

```bash
cd frontend
npm install
```

### Run the frontend

```bash
npm run dev
```

The frontend expects the API at `http://127.0.0.1:8000`.

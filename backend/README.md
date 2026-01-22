# FleetFlow Backend

## Setup (Windows)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a `.env` file in `backend/.env` (copy from `.env.example`) and fill in values:

```powershell
copy .env.example .env
```

## Run the API

```powershell
python -m uvicorn app.main:app --reload
```

Swagger docs:

```
http://127.0.0.1:8000/docs
```

## Notes

- The backend loads environment variables from `backend/.env` using `python-dotenv`.
- If you see `No module named uvicorn`, run `pip install -r requirements.txt` inside the virtual environment.

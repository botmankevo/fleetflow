# FleetFlow

Full-stack scaffold with FastAPI and Next.js.

## Requirements

- Docker (recommended)
- Or local installs of Python 3.11+ and Node.js 18+

## Install Docker (new users)

If you don't have Docker yet, install it first:

- **macOS / Windows**: Install Docker Desktop from https://www.docker.com/products/docker-desktop/
- **Linux**: Install Docker Engine from https://docs.docker.com/engine/install/

After installation, make sure Docker is running before continuing.

## Run with Docker Compose

```bash
cd /workspaces/fleetflow
cp .env.example .env

docker compose up
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000

## Run locally (without Docker)

### Backend

```bash
cd /workspaces/fleetflow
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd /workspaces/fleetflow
cd frontend
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

## Endpoints

- `GET /health`
- `GET /api/greeting`

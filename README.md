# FleetFlow

**FleetFlow** is a production-ready, invite-only, multi-tenant web application for transportation and logistics carriers to manage loads, dispatch, driver proof-of-delivery (POD) submissions, vehicle maintenance, and compliance tracking.

**Primary Tenant**: Cox Transportation & Logistics (CoxTNL), Houston, TX  
MC 1514835 | DOT 4018154 | Dispatch@CoxTNL.com | (832) 840-2760

---

## Features

- **Multi-Tenant Architecture**: Complete data isolation per carrier with invite-only onboarding
- **Load & Dispatch Management**: Create loads, assign drivers, track status
- **POD Submission**: Drivers submit proof-of-delivery with signatures, photos, and BOL scans
- **POD Packet PDF Generation**: Generates single-page PDF with thumbnails and stable Dropbox links
- **Document Management**: Upload and organize compliance docs, BOLs, delivery photos in Dropbox
- **Maintenance Tracking**: Track vehicle maintenance schedules, logs, and costs
- **Compliance Tracking**: Monitor driver and vehicle compliance documents (expiry, status)
- **Role-Based Access**: Platform Owner, Tenant Admin, Dispatcher, Driver, and optional specialized roles
- **RBAC & JWT Auth**: Secure token-based authentication with role enforcement

---

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Migrations**: Alembic
- **Auth**: JWT (access tokens) with Pydantic validation
- **File Storage**: Dropbox API
- **PDF Generation**: Playwright/Chromium (HTML → PDF)
- **Optional Integrations**: Airtable API (feature-flagged)

### Frontend
- **Framework**: Next.js (TypeScript)
- **Styling**: TailwindCSS
- **Responsive**: Mobile-first design (especially for POD driver form)

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Dev Environment**: Complete local stack (postgres, backend, frontend)

---

## Prerequisites

### System Requirements
- **Docker** & **Docker Compose** (recommended for local dev)
- **Node.js** 18+ (if running frontend separately)
- **Python** 3.9+ (if running backend separately)
- **PostgreSQL** 14+ (included in docker-compose)

### Environment Variables
Copy `.env.example` to `.env` and populate:

```bash
cp .env.example .env
```

---

## Quick Start (Docker Compose)

### 1. Clone the Repository

```bash
git clone https://github.com/botmankevo/fleetflow.git
cd fleetflow
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- `JWT_SECRET`: Generate a strong random string (e.g., `openssl rand -hex 32`)
- `DATABASE_URL`: Leave as default for docker-compose or update if using external PostgreSQL
- `DROPBOX_ACCESS_TOKEN`: Your Dropbox app token (get from https://www.dropbox.com/developers/apps)
- `APP_BASE_URL`: `http://localhost:3000` for local dev

### 3. Build and Start Services

```bash
docker compose up --build
```

This will:
- Start PostgreSQL on port `5432`
- Start FastAPI backend on port `8000` (http://localhost:8000)
- Start Next.js frontend on port `3000` (http://localhost:3000)

### 4. Run Alembic Migrations

In a new terminal:

```bash
docker compose exec backend alembic upgrade head
```

Or manually:
```bash
cd backend
alembic upgrade head
```

### 5. Create the First Platform Owner User

Use the provided seed script:

```bash
docker compose exec backend python -m app.scripts.seed_user --email admin@fleetflow.app --password admin123 --role platform_owner
```

**Output:**
```
✓ Platform Owner user created: admin@fleetflow.app (ID: <uuid>)
```

Or if using a CLI approach, the backend includes a command-line tool (see [Manual Setup](#manual-setup) below).

### 6. Test the Backend

```bash
curl http://localhost:8000/health
# Response: {"status":"ok","app":"FleetFlow"}

curl http://localhost:8000/docs
# Opens Swagger UI for API testing
```

---

## Manual Setup (Without Docker)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp ../.env.example .env
# Edit .env with your database URL (default: postgres://user:password@localhost/fleetflow)

# Run migrations
alembic upgrade head

# Create Platform Owner (seed)
python -m app.scripts.seed_user --email admin@fleetflow.app --password admin123 --role platform_owner

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend is now available at **http://localhost:8000**

### Frontend Setup

```bash
cd /workspaces/fleetflow  # or your repo root
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev
```

Frontend is now available at **http://localhost:3000**

#### Frontend troubleshooting

- **`npm install` fails with `EACCES: permission denied` on `node_modules`**
  - This means the `frontend/node_modules` folder is owned by a different user (often from a root-owned install).
  - Fix by removing the folder or correcting ownership, then reinstall:
    ```bash
    rm -rf frontend/node_modules
    npm install
    ```
  - If you already ran `cd frontend`, omit the `frontend/` prefix:
    ```bash
    rm -rf node_modules
    npm install
    ```
- **`next: not found` after `npm run dev`**
  - This typically means dependencies did not install correctly.
  - Re-run `npm install` after fixing permissions as above, then `npm run dev` again.

---

## Database & Migrations

### Apply Migrations

```bash
# Using docker-compose
docker compose exec backend alembic upgrade head

# Or manually
cd backend
alembic upgrade head
```

### Create New Migration

```bash
cd backend
alembic revision --autogenerate -m "description of change"
alembic upgrade head
```

### Rollback Migration

```bash
cd backend
alembic downgrade -1  # Rollback one version
```

---

## Creating a Tenant & Inviting Admin

### Step 1: Login as Platform Owner

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fleetflow.app",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "access_token": "<jwt_token>",
  "token_type": "bearer"
}
```

### Step 2: Create a Tenant (Carrier)

```bash
curl -X POST http://localhost:8000/platform/tenants \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cox Transportation & Logistics",
    "slug": "coxtnl",
    "contact_email": "dispatch@coxtnl.com",
    "contact_phone": "(832) 840-2760",
    "mc_number": "1514835",
    "dot_number": "4018154"
  }'
```

**Response:**
```json
{
  "id": "<tenant_id>",
  "name": "Cox Transportation & Logistics",
  "slug": "coxtnl",
  "created_at": "2026-01-22T..."
}
```

### Step 3: Invite Tenant Admin

```bash
curl -X POST http://localhost:8000/platform/tenants/<tenant_id>/invites \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@coxtnl.com",
    "invited_by": "admin@fleetflow.app"
  }'
```

**Response:**
```json
{
  "invite_token": "<invite_token>",
  "expires_at": "2026-01-29T...",
  "email": "admin@coxtnl.com"
}
```

Admin receives email with invite link (in production; dev uses token directly).

### Step 4: Accept Invite & Complete Onboarding

```bash
curl -X POST http://localhost:8000/auth/invite/accept \
  -H "Content-Type: application/json" \
  -d '{
    "invite_token": "<invite_token>",
    "password": "secure_password_123"
  }'
```

**Response:**
```json
{
  "access_token": "<jwt_token>",
  "user_id": "<user_id>",
  "role": "tenant_admin"
}
```

Tenant Admin can now log in and manage tenant profile, users, drivers, vehicles, and loads.

---

## End-to-End POD Submission Test

### Prerequisites
- Backend and frontend running
- Database migrated
- Platform Owner and Tenant Admin created
- At least one dispatcher, driver, vehicle, and load in system

### Test Flow

#### 1. Create a Load (Dispatcher)

**Login as Dispatcher:**
```bash
DISP_TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dispatcher@coxtnl.com","password":"pass"}' | jq -r '.access_token')
```

**Create Load:**
```bash
curl -X POST http://localhost:8000/tenant/loads \
  -H "Authorization: Bearer $DISP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "load_number": "LOAD-20260122-001",
    "origin": "Houston, TX",
    "destination": "Dallas, TX",
    "pickup_date": "2026-01-22",
    "delivery_date": "2026-01-23",
    "status": "pending"
  }'
```

**Response:**
```json
{
  "id": "<load_id>",
  "load_number": "LOAD-20260122-001",
  "status": "pending",
  "created_at": "2026-01-22T..."
}
```

#### 2. Assign Driver to Load

```bash
curl -X POST http://localhost:8000/tenant/loads/<load_id>/assign-driver \
  -H "Authorization: Bearer $DISP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"driver_id": "<driver_id>"}'
```

#### 3. Driver Submits POD

**Login as Driver:**
```bash
DRIVER_TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"driver@coxtnl.com","password":"pass"}' | jq -r '.access_token')
```

**Submit POD with Files (multipart):**
```bash
curl -X POST http://localhost:8000/pod/submit \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -F "load_id=<load_id>" \
  -F "receiver_name=John Doe" \
  -F "delivery_date=2026-01-23" \
  -F "receiver_signature=@signature.png" \
  -F "delivery_notes=Delivered on time" \
  -F "bol_images=@bol.jpg" \
  -F "delivery_photos=@photo1.jpg" \
  -F "delivery_photos=@photo2.jpg"
```

**Response:**
```json
{
  "pod_id": "<pod_id>",
  "load_id": "<load_id>",
  "dropbox_pod_pdf_link": "https://www.dropbox.com/s/...",
  "dropbox_delivery_photos_zip_link": "https://www.dropbox.com/s/...",
  "status": "submitted",
  "created_at": "2026-01-22T..."
}
```

#### 4. Verify POD PDF in Browser

1. Go to frontend: **http://localhost:3000**
2. Login as Dispatcher or Admin
3. Navigate to **Loads** → select the load
4. Click **"View POD Packet"** to see generated PDF
5. Verify:
   - Single-page layout with company/load summary
   - Thumbnail preview of first BOL image
   - Thumbnail preview of first delivery photo
   - Stable Dropbox links (no expiration)
   - Receiver signature and delivery notes

#### 5. Verify Files in Dropbox

Check your Dropbox app folder:
```
/coxtnl/POD Packets/LOAD-20260122-001/
├── Generated POD/
│   └── POD_LOAD-20260122-001.pdf
├── Signed BOL/
│   └── bol.jpg
└── Delivery Photos/
    ├── photo1.jpg
    ├── photo2.jpg
    └── LOAD-20260122-001_delivery_photos.zip
```

---

## API Documentation

### Interactive API Docs

Once backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/invite/accept` | Accept tenant invite |
| POST | `/platform/tenants` | Create tenant (Platform Owner only) |
| POST | `/platform/tenants/{tenant_id}/invites` | Invite tenant admin |
| GET/POST | `/tenant/profile` | Get/update tenant profile |
| CRUD | `/tenant/users` | Manage tenant users |
| CRUD | `/tenant/drivers` | Manage drivers |
| CRUD | `/tenant/vehicles` | Manage vehicles |
| CRUD | `/tenant/loads` | Manage loads |
| POST | `/tenant/loads/{id}/assign-driver` | Assign driver to load |
| POST | `/pod/submit` | Submit POD (multipart) |
| GET | `/loads/{id}/pod` | Get POD status & links |
| CRUD | `/maintenance/items` | Manage maintenance schedules |
| CRUD | `/maintenance/logs` | Log maintenance work |
| CRUD | `/compliance/driver-docs` | Manage driver compliance docs |
| CRUD | `/compliance/vehicle-docs` | Manage vehicle compliance docs |

---

## Environment Variables Reference

### `.env.example`

```bash
# App
APP_NAME=FleetFlow
APP_BASE_URL=http://localhost:3000
DEBUG=false

# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/fleetflow

# JWT
JWT_SECRET=your-secret-key-change-in-prod
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Dropbox
DROPBOX_ACCESS_TOKEN=your_dropbox_access_token

# Airtable (Optional)
AIRTABLE_ENABLED=false
AIRTABLE_TOKEN=
AIRTABLE_BASE_ID=

# Google Maps (Optional)
GOOGLE_MAPS_API_KEY=

# SMTP (Optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@fleetflow.app
```

---

## Troubleshooting

### Backend won't start (port 8000 already in use)

```bash
# Find and kill process using port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port
uvicorn app.main:app --port 8001
```

### Database connection error

```bash
# Verify PostgreSQL is running
docker compose ps postgres

# Check DATABASE_URL in .env
# Default: postgresql://postgres:postgres@postgres:5432/fleetflow

# Re-run migrations
docker compose exec backend alembic upgrade head
```

### Frontend can't reach backend

```bash
# Verify backend is running
curl http://localhost:8000/health

# Check NEXT_PUBLIC_API_URL in frontend/.env.local
# Should be: http://localhost:8000
```

### Dropbox files not uploading

```bash
# Verify DROPBOX_ACCESS_TOKEN in .env
# Ensure app token has file write permissions

# Test with curl
curl -X POST https://content.dropboxapi.com/2/files/get_metadata \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"path": "/"}'
```

### Migrations failing

```bash
# Check alembic history
docker compose exec backend alembic history

# Manually reset (dev only; data loss)
docker compose exec backend alembic downgrade base
docker compose exec backend alembic upgrade head
```

---

## Deployment (Production)

### Prerequisites
- Managed PostgreSQL database
- Dropbox Business account with app integration
- SMTP email service (SendGrid, AWS SES, etc.)
- HTTPS domain
- Docker registry (Docker Hub, ECR, etc.)

### Steps (High-level)

1. **Build images**:
   ```bash
   docker build -t fleetflow-backend ./backend
   docker build -t fleetflow-frontend ./frontend
   ```

2. **Push to registry**:
   ```bash
   docker push <your-registry>/fleetflow-backend
   docker push <your-registry>/fleetflow-frontend
   ```

3. **Deploy to orchestration platform** (Kubernetes, ECS, Docker Swarm, etc.)

4. **Set production secrets**:
   - `JWT_SECRET`: Strong random string
   - `DROPBOX_ACCESS_TOKEN`: Production app token
   - `DATABASE_URL`: Managed PostgreSQL
   - `SMTP_*`: Production email service
   - `APP_BASE_URL`: Production domain

5. **Run migrations**:
   ```bash
   kubectl exec <backend-pod> -- alembic upgrade head
   ```

6. **Create seed user** (see [Create Platform Owner](#creating-a-tenant--inviting-admin))

---

## Development

### Running Tests

```bash
cd backend

# Run pytest
pytest

# With coverage
pytest --cov=app tests/
```

### Code Quality

```bash
# Backend: lint with flake8
flake8 app/

# Backend: format with black
black app/

# Frontend: lint with eslint
cd frontend && npm run lint

# Frontend: format with prettier
npm run format
```

### File Structure

```
fleetflow/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app entry
│   │   ├── api/                    # Route handlers
│   │   │   ├── auth.py
│   │   │   ├── platform.py
│   │   │   ├── tenant.py
│   │   │   ├── loads.py
│   │   │   ├── pod.py
│   │   │   ├── maintenance.py
│   │   │   └── compliance.py
│   │   ├── core/
│   │   │   ├── config.py           # Settings/env vars
│   │   │   ├── database.py         # SQLAlchemy setup
│   │   │   ├── security.py         # JWT & RBAC
│   │   │   └── middleware.py       # Tenant scoping, auth
│   │   ├── models/
│   │   │   └── models.py           # SQLAlchemy ORM
│   │   ├── schemas/
│   │   │   └── schemas.py          # Pydantic request/response
│   │   ├── services/
│   │   │   ├── dropbox_service.py
│   │   │   ├── pdf_service.py
│   │   │   ├── zip_service.py
│   │   │   ├── email_service.py
│   │   │   └── airtable_service.py
│   │   ├── scripts/
│   │   │   └── seed_user.py        # Seed admin user
│   │   └── utils/
│   │       ├── audit_log.py
│   │       └── errors.py
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/               # Migration files
│   ├── alembic.ini
│   ├── requirements.txt
│   └── tests/
│       ├── test_auth.py
│       ├── test_pod.py
│       └── test_tenants.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/                    # Next.js app directory
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── api.ts             # API client
│   │   │   └── auth.ts            # Auth helpers
│   │   └── styles/
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
├── docker-compose.yml
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -am 'Add my feature'`
3. Push to branch: `git push origin feature/my-feature`
4. Open a Pull Request

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Support

For questions or issues:
- **Email**: Dispatch@CoxTNL.com
- **GitHub Issues**: https://github.com/botmankevo/fleetflow/issues

---

**FleetFlow v0.1.0** | Built for carriers. Built for scale.

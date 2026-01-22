# FleetFlow Dispatch Portal

Internal-only TMS/dispatch portal for Carrier Outgoing Xpress LLC dba Cox Transportation & Logistics (CoxTNL).

## Stack
- Backend: FastAPI + SQLAlchemy + Alembic + PostgreSQL
- Frontend: Next.js + TypeScript + Tailwind
- Storage: Dropbox (shared links as system of record)
- Optional: Airtable integration

## Local Development

### Prerequisites
- Docker + Docker Compose

### Setup
1. Copy environment template:
   ```bash
   cp .env.example .env
   ```
2. Fill in required secrets (Dropbox, JWT, Google Maps, SMTP as needed).
3. Start services:
   ```bash
   docker compose up --build
   ```
4. Run migrations (optional initial step):
   ```bash
   docker compose exec backend alembic upgrade head
   ```
5. Seed sample data:
   ```bash
   docker compose exec backend python app/seed.py
   ```
6. Access the apps:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000/docs

### Default Seed Users
- admin@coxtnl.com / password (admin)
- dispatch@coxtnl.com / password (dispatcher)
- driver@coxtnl.com / password (driver)

## Dropbox Storage Layout
```
/POD Packets/{Load ID}/Generated POD/
/POD Packets/{Load ID}/Signed BOL/
/POD Packets/{Load ID}/Delivery Photos/
```
- ZIPs are stored as `/POD Packets/{Load ID}/Delivery Photos/{LoadID}_photos.zip`.

## Airtable Integration
Enable with `AIRTABLE_ENABLED=true`. The backend will upsert to:
- Loads
- POD Submissions

Attachments are appended rather than overwritten.

## PDF POD Packet
POD packet generation uses an HTML template rendered server-side with Playwright.
Preview thumbnails are resized to keep PDFs 1-2 pages.

## Notes
- Truck routes are best effort; drivers should verify restrictions.
- Use phone native “Scan Documents” when uploading PODs.

# FleetFlow Runbook

## Migrations
- Apply: `cd backend && alembic upgrade head`
- Rollback: `cd backend && alembic downgrade -1`

## Health Checks
- Backend: `GET /health`
- Docs: `GET /docs`

## Common Recovery
- DB connectivity: confirm `DATABASE_URL` and `docker compose ps`
- Auth failures: confirm `JWT_SECRET` matches across services
- Dropbox errors: set `ENABLE_DROPBOX=true` and `DROPBOX_ACCESS_TOKEN`
- Maps errors: set `ENABLE_GOOGLE_MAPS=true` and `GOOGLE_MAPS_API_KEY`

## Service Restart (Docker)
- `docker compose up -d --build`

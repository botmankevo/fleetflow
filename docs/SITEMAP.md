# FleetFlow Sitemap & Workflow

## Purpose
FleetFlow is a multi-tenant operations platform for carriers to manage loads, dispatch, driver POD submission, and compliance/maintenance tracking. The system optimizes the dispatch flow by extracting load details from rate confirmation PDFs and capturing proof-of-delivery packets with audit trails.

## Core Roles
- Platform Owner: manages tenants and invitations
- Tenant Admin: manages carrier setup, users, drivers, and dispatch operations
- Dispatcher: creates/edits loads, assigns drivers, tracks POD status
- Driver: submits POD (photos + BOL + signature)
- Compliance/Maintenance: manages vehicle and driver documents (phase 2)

## Primary Workflow (Happy Path)
1) Platform owner creates tenant and invites tenant admin.
2) Tenant admin sets up drivers, trucks/trailers.
3) Dispatcher uploads rate confirmation and extracts load data.
4) Dispatcher reviews/edits extracted fields and creates the load.
5) Dispatcher assigns driver, truck, trailer, and carrier.
6) Driver delivers and submits POD with files and signature.
7) System generates POD PDF packet and shares links.
8) Broker/customer receives POD notification (optional).
9) Audit log records each key action.

## Sitemap (Role-Aware)
### Public
- /login
- /accept-invite?token=...

### Dashboard (Authenticated)
- /dashboard
  - Overview KPIs and quick actions
- /dashboard/loads
  - List + create loads, upload rate confirmation, assign driver
- /dashboard/loads/[id]
  - Load detail, status transitions, audit log
- /dashboard/pod
  - POD submission form (driver-friendly)
- /dashboard/drivers
  - Create/list/update drivers

### Platform Owner
- /dashboard/platform
  - Create tenant
  - Invite tenant admin

### Phase 2 (Planned)
- /dashboard/vehicles
- /dashboard/maintenance
- /dashboard/compliance

## Phased Requirements Checklist
### Phase 1 (MVP Core Dispatch)
- Auth: login, invite acceptance
- Loads: create/edit/list, assign driver, status updates
- Rate confirmation extraction: upload PDF → extracted fields
- Drivers: CRUD
- POD submission: upload BOL + photos + signature, PDF generation
- Audit logs: view per load

### Phase 2 (Operations + Compliance)
- Vehicles: CRUD
- Maintenance schedules and logs
- Compliance documents with expiry tracking
- Alerts/notifications (expiring docs, PODs)

### Phase 3 (Polish + Integrations)
- RBAC UI gating per role
- Broker/customer notifications
- Reporting dashboards
- SLA tracking and analytics

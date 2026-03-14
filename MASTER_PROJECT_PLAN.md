# MainTMS - Master Project & Recovery Plan
**Date**: March 5, 2026

## 🎯 The Ultimate Goal
To build a world-class, production-ready Transportation Management System (MainTMS) for Cox Transport & Logistics. The system is designed to provide a competitive advantage over legacy and modern competitors by offering a "Delightful" and ultra-modern UI (inspired by the best modern dashboards like QuickBooks or tailored Shadcn/ui layouts), a blazing fast Next.js frontend, and a highly scalable FastAPI Python backend. 

Key defining capabilities:
- **AI-powered**: OCR rate confirmation extraction.
- **Data-rich integrations**: Live FMCSA broker verification and Mapbox routing.
- **Complete Suite**: End-to-end management of loads, dispatch, drivers, equipment, billing, payroll, and document exchange.
- **Stunning Aesthetics**: An intuitive, highly responsive, dark-mode capable, and modern user experience.

---

## 🏗️ What We Have Built (Current State)

### 1. Robust Backend (FastAPI + PostgreSQL)
- **100% Core API Complete**: Over 25+ endpoints across 12 routers for loads, customers, Auth, invoicing, dispatcher board, etc.
- **Advanced Features**: Mapbox integration for routing, FMCSA live verification for broker compliance.
- **Database Scaled**: Seeded with demo data (600 historical loads, 155 customers/brokers, 11 auto-generated drivers, 1 admin user).
- **Security**: Full JWT authentication and Role-Based Access Control (RBAC).

### 2. Modern Frontend Foundation (Next.js + Tailwind CSS)
- **Dashboard & Layout**: Created a dashboard, robust Sidebar, and navigation.
- **Data Views**: Load management implementation including list and card views, full pagination (25/50/100), and color-coded status tracking.
- **UI Components**: Implementation of Toast notifications, skeletons, modable grids (e.g., the 2x3 Document grid for RC, BOL, POD, INV, RCP, OTH).
- **Import Scripts**: Excel ingestion for brokers, shippers, and historical loads.

### 3. Recent Features
- **Driver Payroll CRUD (Backend)**: Added 9 new endpoints for pay profiles, equipment owners, and recurring deductions. (Frontend wiring pending).
- **Document Exchange System (Backend)**: Created base models and logic for driver document reviews. (Database table and frontend wiring pending).
- **UI Tweaks**: New gradient "AI" logo, narrowed sidebar, dark mode enhancements.

---

## 🚧 What We Need to Build (Outstanding Work & Bugs)

### Immediate Fixes
- **Document Upload API Bug**: Fix the 401 Unauthorized error returning from `/document-uploads/loads/{id}/upload`.
- **UI Cache/Display Bugs**: Dark Mode classes are applied in code but not rendering due to aggressive Next.js caching. Logo changes might also be cached. 
- **Database Migrations**: Run the pending alembic migrations to create the missing `document_exchange` table.

### Feature Integration & Wiring
- **Delightful Design Hub Integration (Hybrid Approach)**: Replace the standard Next.js layout with the modern grouped Sidebar and AppLayout from shadcn/ui.
- **Driver Payroll UI**: Connect the Driver modal UI tabs to the newly built 9 backend endpoints for Pay Profiles and Additions/Deductions.
- **Document Exchange UI**: Connect the frontend to the new document accept/reject endpoints.

### Future/Advanced Capabilities
- **AI OCR Pipeline**: Connect the OCR extraction system allowing users to dump a Rate Confirmation and automatically parse load info.
- **Productionization**: Final code cleanup, removal of unused demo scripts, Docker configuration hardening, and cloud deployment prep.

---

## ✅ Actionable Checklist Plan
*(Mark these with an "x" as we progress. Stop and save this file if interrupted.)*

### Phase 1: Environment & Bug Fixes
- [x] 1. Run database migrations to ensure all tables exist (`alembic upgrade head`), specifically for `document_exchange`.
- [x] 2. Clear Next.js cache (`rm -rf .next` or `docker system prune` if needed) and rebuild frontend to force Dark Mode and Logo changes to appear.
- [x] 3. Debug and fix the `401 Unauthorized` token error in the Document Upload endpoint. *(Reason: The JWT local storage token expired organically since Feb 09. Logging out and logging back in resolves this)*
- [ ] 4. Verify Document Upload modal successfully uploads to the backend and updates the 2x3 grid.

### Phase 2: The "Delightful Design" UI Integration
- [x] 5. Install necessary `shadcn/ui` layout components (sidebar, collapsible, avatar) into the frontend.
- [x] 6. Implement the new grouped AppSidebar and AppLayout to replace the old vertical dock.
- [x] 7. Update existing pages (Dashboard, Admin) to use the new UI layout structure.
- [x] 8. Verify responsiveness and dark mode in the new layout. *(Confirmed working via screenshot - dark mode, grouped nav, MAIN AI TMS logo all visible)*

### Phase 3: Frontend Feature Wiring
- [x] 9. Wire the **Driver Payroll** UI: Add forms/tabs in the Driver Modal to interact with Pay Profile POST/PATCH endpoints.
- [x] 10. Wire the **Driver Payroll** UI: Add capabilities to manage equipment owners and recurring items (escrow/deductions).
- [x] 11. Wire the **Document Exchange** UI: Implement the interface for reviewing, accepting, and rejecting driver pod/document uploads.

### Phase 4: Polish & Deploy Readiness
- [x] **Item 12: Mapbox & FMCSA Testing**
    - [x] Create Settings page with live integration test widgets.
    - [x] Implement Mapbox health check and autocomplete tester.
    - [x] Implement FMCSA DOT lookup verification widget.
- [x] **Item 13: AI OCR Flow for Rate Confirmations**
    - [x] Develop `AICreateLoadModal` with file upload and parsing status.
    - [x] Integrate "Create with AI" into Dispatch Board header.
    - [x] Support PDF and Image parsing with review/edit feedback loop.
- [ ] **Item 14: Quality Audit & Cleanup**
    - [x] Fix Next.js 14 metadata deprecation warnings in `layout.tsx`.
    - [ ] Remove unused components and cleanup console logs across app.
    - [ ] Verify responsiveness of all new dashboards.
- [ ] **Item 15: Deployment Readiness**
    - [ ] Create `docker-compose.prod.yml` for production scaling.
    - [ ] Finalize environment variable documentation.
    - [ ] Prepare final handover summary.

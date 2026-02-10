from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, loads, pod, maintenance, expenses, drivers, maps, users, equipment, analytics, payroll, mapbox_routes, fmcsa_routes, dispatch, customers, invoices, ai, customer_portal, accounting, quickbooks, communications, documents, document_uploads, loadboards, motive, safety, tolls, vendors, ifta
# from app.routers import imports  # Has dependency issues, skipping for now

app = FastAPI(title="MAIN TMS", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(loads.router)
# app.include_router(imports.router)  # Temporarily disabled for testing
app.include_router(pod.router)
app.include_router(maintenance.router)
app.include_router(expenses.router)
app.include_router(drivers.router)
app.include_router(maps.router)
app.include_router(users.router)
app.include_router(equipment.router)
app.include_router(analytics.router)
app.include_router(payroll.router)
app.include_router(mapbox_routes.router)
app.include_router(fmcsa_routes.router)
app.include_router(dispatch.router)
app.include_router(customers.router)
app.include_router(ai.router)
app.include_router(invoices.router)
app.include_router(accounting.router)
app.include_router(quickbooks.router)
app.include_router(communications.router)
app.include_router(documents.router)
app.include_router(document_uploads.router)
app.include_router(loadboards.router)
app.include_router(motive.router)
app.include_router(customer_portal.router)
app.include_router(safety.router)
app.include_router(tolls.router)
app.include_router(vendors.router)
app.include_router(ifta.router)


@app.get("/health")
def health():
    return {"ok": True}

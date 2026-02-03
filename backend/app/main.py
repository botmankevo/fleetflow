from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, loads, pod, maintenance, expenses, drivers, maps, users, equipment, analytics, payroll

app = FastAPI(title="FleetFlow", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(loads.router)
app.include_router(pod.router)
app.include_router(maintenance.router)
app.include_router(expenses.router)
app.include_router(drivers.router)
app.include_router(maps.router)
app.include_router(users.router)
app.include_router(equipment.router)
app.include_router(analytics.router)
app.include_router(payroll.router)


@app.get("/health")
def health():
    return {"ok": True}

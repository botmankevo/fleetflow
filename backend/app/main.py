from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, health, loads

app = FastAPI(title="FleetFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"]
    ,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(health.router)
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(loads.router, tags=["loads"])

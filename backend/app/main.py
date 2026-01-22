from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, loads, pods, maintenance, expenses, users
from app.core.config import settings

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(loads.router, prefix="/api")
app.include_router(pods.router, prefix="/api")
app.include_router(maintenance.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(users.router, prefix="/api")


@app.get("/health")
async def health_check():
    return {"status": "ok"}

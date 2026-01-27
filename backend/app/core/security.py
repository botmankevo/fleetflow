from datetime import datetime, timedelta, timezone
from typing import Any, Dict
from jose import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security = HTTPBearer()


def create_access_token(payload: Dict[str, Any]) -> str:
    data = payload.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.TOKEN_EXP_MINUTES)
    data["exp"] = expire
    return jwt.encode(data, settings.JWT_SECRET, algorithm="HS256")


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Dict[str, Any]:
    token = credentials.credentials
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.settings import JWT_SECRET, TOKEN_EXP_MINUTES

ALGORITHM = "HS256"
security_scheme = HTTPBearer()


def create_access_token(payload: Dict[str, Any]) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXP_MINUTES)
    to_encode = {**payload, "exp": expire}
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> Dict[str, Any]:
    token = credentials.credentials
    return decode_access_token(token)

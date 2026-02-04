from datetime import datetime, timedelta, timezone
from typing import Any, Dict
import hashlib
import hmac
import secrets
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


def hash_password(plain: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac("sha256", plain.encode("utf-8"), salt, 120_000)
    return f"pbkdf2${salt.hex()}${derived.hex()}"


def verify_password(plain: str, stored: str) -> bool:
    if stored.startswith("pbkdf2$"):
        try:
            _, salt_hex, hash_hex = stored.split("$", 2)
            salt = bytes.fromhex(salt_hex)
            expected = bytes.fromhex(hash_hex)
            derived = hashlib.pbkdf2_hmac("sha256", plain.encode("utf-8"), salt, 120_000)
            return hmac.compare_digest(derived, expected)
        except Exception:
            return False
    return hmac.compare_digest(plain, stored)


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


async def get_current_user(
    token_data: Dict[str, Any] = Depends(verify_token)
):
    """Get current user from token - simplified version"""
    return token_data

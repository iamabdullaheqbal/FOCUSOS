"""
FocusOS — JWT Auth Dependency
================================
FastAPI dependency that validates Bearer tokens and injects user_id.
"""

import os
import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.db import get_db
from models.user import User
import logging

logger = logging.getLogger(__name__)
_bearer = HTTPBearer(auto_error=False)


def _secret() -> str:
    s = os.environ.get("APP_SECRET_KEY") or os.environ.get("FLASK_SECRET_KEY")
    if not s:
        raise HTTPException(status_code=500, detail="Auth key not configured")
    return s


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, _secret(), algorithms=["HS256"], options={"verify_aud": False})
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Auto-create user profile on first login
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        email = payload.get("email") or f"{user_id}@local.focusos"
        new_user = User(
            id=user_id, email=email,
            username=payload.get("username"),
            full_name=payload.get("full_name"),
        )
        db.add(new_user)
        await db.commit()

    return user_id

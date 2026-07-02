"""FocusOS — Auth Router (register / login / refresh / me)"""

import os
import uuid
import jwt
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from werkzeug.security import generate_password_hash, check_password_hash

from database.db import get_db
from models.user import User
from utils.errors import APIError

router = APIRouter(prefix="/auth", tags=["auth"])

TOKEN_TTL_HOURS = 24
REFRESH_TTL_DAYS = 30
_bearer = HTTPBearer(auto_error=False)


def _secret() -> str:
    s = os.environ.get("APP_SECRET_KEY") or os.environ.get("FLASK_SECRET_KEY")
    if not s:
        raise HTTPException(status_code=500, detail="Auth key not configured")
    return s


def _make_tokens(user: User) -> tuple[str, str]:
    now = datetime.now(timezone.utc)
    secret = _secret()
    base = {
        "sub": user.id, "email": user.email,
        "username": user.username, "full_name": user.full_name,
        "is_demo": False, "iat": now.timestamp(),
    }
    access = jwt.encode({**base, "exp": now + timedelta(hours=TOKEN_TTL_HOURS)}, secret, algorithm="HS256")
    refresh = jwt.encode({**base, "exp": now + timedelta(days=REFRESH_TTL_DAYS), "type": "refresh"}, secret, algorithm="HS256")
    return access, refresh


# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterIn(BaseModel):
    email: str
    password: str
    full_name: str | None = None
    username: str | None = None


class LoginIn(BaseModel):
    email: str
    password: str


class RefreshIn(BaseModel):
    refresh_token: str


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
async def register(body: RegisterIn, db: AsyncSession = Depends(get_db)):
    email = body.email.lower().strip()
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = User(
        id=str(uuid.uuid4()),
        email=email,
        password_hash=generate_password_hash(body.password),
        full_name=body.full_name,
        username=body.username,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access, refresh = _make_tokens(user)
    return {"access_token": access, "refresh_token": refresh, "user": user.serialize()}


@router.post("/login")
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)):
    email = body.email.lower().strip()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash or not check_password_hash(user.password_hash, body.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access, refresh = _make_tokens(user)
    return {"access_token": access, "refresh_token": refresh, "user": user.serialize()}


@router.post("/refresh")
async def refresh(body: RefreshIn, db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(body.refresh_token, _secret(), algorithms=["HS256"], options={"verify_aud": False})
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Not a refresh token")

    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    access, new_refresh = _make_tokens(user)
    return {"access_token": access, "refresh_token": new_refresh}


@router.get("/me")
async def me(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = jwt.decode(credentials.credentials, _secret(), algorithms=["HS256"], options={"verify_aud": False})
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": user.serialize()}

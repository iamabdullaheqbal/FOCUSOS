"""FocusOS — Notifications Router"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from database.db import get_db
from models.notification import Notification
from utils.auth import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def get_notifications(
    limit: int = 100,
    offset: int = 0,
    unread_only: bool = False,
    category: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    q = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        q = q.where(Notification.read == False)
    if category:
        q = q.where(Notification.category == category)
    q = q.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(q)
    notifications = result.scalars().all()
    return {"success": True, "data": [n.to_dict() for n in notifications]}


@router.put("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.read = True
    await db.commit()
    return {"success": True}


@router.put("/read-all")
async def mark_all_read(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        update(Notification).where(Notification.user_id == user_id).values(read=True)
    )
    await db.commit()
    return {"success": True}


@router.delete("/clear")
async def clear_all(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(delete(Notification).where(Notification.user_id == user_id))
    await db.commit()
    return {"success": True}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    await db.delete(notif)
    await db.commit()
    return {"success": True}

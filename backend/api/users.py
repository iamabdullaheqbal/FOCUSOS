"""FocusOS — Users Router (account deletion)"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database.db import get_db
from models.user import User
from utils.auth import get_current_user_id

router = APIRouter(tags=["users"])


@router.delete("/account")
async def delete_account(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()
    return {"status": "success", "data": {"message": "Account deleted successfully"}}

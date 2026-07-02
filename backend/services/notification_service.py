"""FocusOS — Notification Service (sync, psycopg2 fallback)"""

import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


def _sync_session():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from config import settings
    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
    engine = create_engine(sync_url, pool_pre_ping=True, pool_size=2)
    return Session(engine), engine


class NotificationService:

    @staticmethod
    def create_notification(
        title: str,
        description: Optional[str] = None,
        severity: str = "info",
        priority: str = "info",
        module: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        action_url: Optional[str] = None,
        icon: Optional[str] = None,
        color: Optional[str] = None,
        category: str = "System",
        user_id: Optional[str] = None,
    ):
        from models.notification import Notification
        try:
            session, engine = _sync_session()
            with session:
                notif = Notification(
                    user_id=user_id, title=title, description=description,
                    severity=severity, priority=priority, module=module,
                    entity_type=entity_type, entity_id=entity_id,
                    action_url=action_url, icon=icon, color=color, category=category,
                )
                session.add(notif)
                session.commit()
                session.refresh(notif)
                result = notif.to_dict()
            engine.dispose()
            return result
        except Exception as e:
            logger.error("create_notification failed: %s", e)
            return None

    @staticmethod
    def get_notifications(
        limit: int = 100,
        offset: int = 0,
        unread_only: bool = False,
        category: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        from models.notification import Notification
        from sqlalchemy import select, func
        try:
            session, engine = _sync_session()
            with session:
                q = select(Notification).where(Notification.user_id == user_id)
                if unread_only:
                    q = q.where(Notification.read == False)
                if category:
                    q = q.where(Notification.category == category)

                total = session.execute(
                    select(func.count()).select_from(q.subquery())
                ).scalar() or 0
                unread = session.execute(
                    select(func.count()).select_from(Notification)
                    .where(Notification.user_id == user_id, Notification.read == False)
                ).scalar() or 0
                rows = session.execute(
                    q.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
                ).scalars().all()
                data = [n.to_dict() for n in rows]
            engine.dispose()
            return {"notifications": data, "total": total, "unread_count": unread}
        except Exception as e:
            logger.error("get_notifications failed: %s", e)
            return {"notifications": [], "total": 0, "unread_count": 0}

    @staticmethod
    def mark_as_read(notification_id: str, user_id: Optional[str] = None) -> bool:
        from models.notification import Notification
        from sqlalchemy import select
        try:
            session, engine = _sync_session()
            with session:
                notif = session.execute(
                    select(Notification).where(Notification.id == notification_id)
                ).scalar_one_or_none()
                if notif:
                    notif.read = True
                    session.commit()
                    engine.dispose()
                    return True
            engine.dispose()
            return False
        except Exception as e:
            logger.error("mark_as_read failed: %s", e)
            return False

    @staticmethod
    def mark_all_as_read(user_id: Optional[str] = None) -> bool:
        from models.notification import Notification
        from sqlalchemy import update
        try:
            session, engine = _sync_session()
            with session:
                session.execute(
                    update(Notification)
                    .where(Notification.user_id == user_id, Notification.read == False)
                    .values(read=True)
                )
                session.commit()
            engine.dispose()
            return True
        except Exception as e:
            logger.error("mark_all_as_read failed: %s", e)
            return False

    @staticmethod
    def clear_all(user_id: Optional[str] = None) -> bool:
        from models.notification import Notification
        from sqlalchemy import delete
        try:
            session, engine = _sync_session()
            with session:
                session.execute(delete(Notification).where(Notification.user_id == user_id))
                session.commit()
            engine.dispose()
            return True
        except Exception as e:
            logger.error("clear_all failed: %s", e)
            return False

    @staticmethod
    def delete_notification(notification_id: str, user_id: Optional[str] = None) -> bool:
        from models.notification import Notification
        from sqlalchemy import select
        try:
            session, engine = _sync_session()
            with session:
                notif = session.execute(
                    select(Notification).where(Notification.id == notification_id)
                ).scalar_one_or_none()
                if notif:
                    session.delete(notif)
                    session.commit()
                    engine.dispose()
                    return True
            engine.dispose()
            return False
        except Exception as e:
            logger.error("delete_notification failed: %s", e)
            return False

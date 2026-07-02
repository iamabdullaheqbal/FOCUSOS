"""FocusOS — Calendar Service (sync, psycopg2 fallback)"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


def _sync_session():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from config import settings
    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
    engine = create_engine(sync_url, pool_pre_ping=True, pool_size=2)
    return Session(engine), engine


class CalendarService:

    @classmethod
    def get_events(cls, start_date: Optional[str] = None, end_date: Optional[str] = None, user_id: Optional[str] = None) -> List[Dict]:
        from models.task import Task
        from models.goal import Goal
        from models.schedule import Schedule
        from models.calendar_event import CalendarEvent
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload

        events: List[Dict] = []
        session, engine = _sync_session()
        try:
            start = _parse_dt(start_date)
            end   = _parse_dt(end_date)

            # ── 1. CalendarEvent rows (meetings scheduled via voice / manual) ──
            ce_q = select(CalendarEvent).where(CalendarEvent.user_id == user_id)
            if start:
                ce_q = ce_q.where(CalendarEvent.start_time >= start)
            if end:
                ce_q = ce_q.where(CalendarEvent.start_time <= end)
            for ev in session.execute(ce_q).scalars().all():
                events.append({
                    "id":          ev.id,
                    "title":       ev.title,
                    "start":       ev.start_time.isoformat() if ev.start_time else None,
                    "end":         ev.end_time.isoformat()   if ev.end_time   else None,
                    "type":        ev.event_type,
                    "attendees":   ev.attendees,
                    "description": ev.description,
                    "source":      ev.source,
                    "risk_level":  "Low",
                })

            # ── 2. Tasks as deadline events ────────────────────────────────────
            q = select(Task).where(Task.user_id == user_id)
            if start:
                q = q.where(Task.deadline >= start)
            if end:
                q = q.where(Task.deadline <= end)
            for t in session.execute(q).scalars().all():
                if not t.deadline:
                    continue
                dl = t.deadline if t.deadline.tzinfo else t.deadline.replace(tzinfo=timezone.utc)
                st = dl - timedelta(hours=t.estimated_hours or 1)
                events.append({"id": t.id, "title": f"Deadline: {t.title}",
                                "start": st.isoformat(), "end": dl.isoformat(),
                                "type": "deadline", "risk_level": "High" if (t.priority_score or 0) > 80 else "Low"})

            # ── 3. Goals as single-day events ──────────────────────────────────
            for g in session.execute(select(Goal).where(Goal.user_id == user_id)).scalars().all():
                if not g.target_date:
                    continue
                try:
                    g_dt = (datetime.strptime(g.target_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                            if len(g.target_date) == 10 else _parse_dt(g.target_date))
                    if not g_dt:
                        continue
                    if start and g_dt < start:
                        continue
                    if end and g_dt > end:
                        continue
                    events.append({"id": g.id, "title": f"Goal: {g.title}",
                                   "start": g_dt.replace(hour=9, minute=0).isoformat(),
                                   "end":   g_dt.replace(hour=10, minute=0).isoformat(),
                                   "type": "goal", "risk_level": "Medium"})
                except Exception:
                    pass

            # ── 4. Schedule slots ──────────────────────────────────────────────
            for sched in session.execute(
                select(Schedule).where(Schedule.user_id == user_id).options(selectinload(Schedule.slots))
            ).scalars().all():
                try:
                    base = datetime.strptime(sched.target_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                    if start and base < start:
                        continue
                    if end and base > end:
                        continue
                    for slot in sched.slots:
                        sh, sm = map(int, slot.start_time.split(":"))
                        eh, em = map(int, slot.end_time.split(":"))
                        events.append({
                            "id":          slot.id,
                            "title":       slot.task_title,
                            "start":       base.replace(hour=sh, minute=sm).isoformat(),
                            "end":         base.replace(hour=eh, minute=em).isoformat(),
                            "type":        "meeting" if "meeting" in slot.task_title.lower() else "task",
                            "is_break":    slot.is_break,
                            "focus_block": slot.focus_block,
                            "risk_level":  "Low",
                        })
                except Exception:
                    pass

            return events
        except Exception as e:
            logger.error("get_events failed: %s", e)
            return []
        finally:
            session.close(); engine.dispose()

    @classmethod
    def get_intelligence(cls, user_id: Optional[str] = None) -> Dict:
        return {
            "capacity_percent": 80, "remaining_hours": 12,
            "schedule_confidence": 75, "current_risk": "Low",
            "next_deadline": "Tomorrow",
            "insights": {
                "planning": ["Schedule is tightly packed. Minimise context switching."],
                "accountability": ["Consistency is dropping. Stick to the scheduled blocks."],
                "coach": ["Commit to the 2PM block."],
            },
            "twin_warnings": [],
            "rescue_overlays": [],
        }

    @classmethod
    def reschedule_event(cls, event_id: str, new_start: Optional[str], new_end: Optional[str], user_id: Optional[str] = None) -> bool:
        from models.task import Task
        from models.calendar_event import CalendarEvent
        from sqlalchemy import select
        session, engine = _sync_session()
        try:
            # Try CalendarEvent first
            ev = session.execute(
                select(CalendarEvent).where(CalendarEvent.id == event_id, CalendarEvent.user_id == user_id)
            ).scalar_one_or_none()
            if ev:
                if new_start:
                    ev.start_time = _parse_dt(new_start) or ev.start_time
                if new_end:
                    ev.end_time = _parse_dt(new_end) or ev.end_time
                session.commit()
                return True

            # Fall back to Task deadline
            task = session.execute(select(Task).where(Task.user_id == user_id, Task.id == event_id)).scalar_one_or_none()
            if not task:
                return False
            target = new_end or new_start
            if not target:
                return False
            task.deadline = _parse_dt(target) or task.deadline
            task.updated_at = datetime.now(timezone.utc)
            session.commit()
            return True
        except Exception as e:
            logger.error("reschedule_event failed: %s", e)
            return False
        finally:
            session.close(); engine.dispose()


def _parse_dt(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None

from typing import Dict, Any
from datetime import datetime, timezone
from models.task import Task
from services.calendar_service import CalendarService

class AvailabilityService:
    @classmethod
    def get_current_availability(cls) -> Dict[str, Any]:
        """
        Calculates user capacity and workload dynamically.
        Primary Sources: Calendar events, focus blocks, meetings.
        Fallback: Standard 8h workday.
        """
        events = CalendarService.get_events()
        
        if not events and CalendarService.is_empty():
            # Fallback Logic
            return {
                "available_hours_today": 8,
                "scheduled_hours_today": 0,
                "focus_hours_today": 0,
                "available_hours_this_week": 40,
                "capacity_remaining": 40,
                "utilization_percentage": 0
            }
            
        # Parse today's scheduled hours
        now = datetime.now(timezone.utc)
        today_events = [e for e in events if e.get("start") and datetime.fromisoformat(e["start"].replace('Z', '+00:00')).date() == now.date()]
        
        scheduled_hours = sum([cls._calculate_hours(e) for e in today_events])
        focus_hours = sum([cls._calculate_hours(e) for e in today_events if e.get("type") == "focus_block"])
        
        # Calculate Pending Task estimated hours
        pending_tasks = Task.query.filter(Task.status != 'done').all()
        pending_hours = sum([t.estimated_hours for t in pending_tasks if t.estimated_hours])
        
        # Calculate available hours based on user's default daily limit (assumed 8 for now)
        baseline_weekly = 40
        capacity_remaining = baseline_weekly - pending_hours
        
        return {
            "available_hours_today": max(0, 8 - scheduled_hours),
            "scheduled_hours_today": scheduled_hours,
            "focus_hours_today": focus_hours,
            "available_hours_this_week": baseline_weekly,
            "capacity_remaining": capacity_remaining,
            "utilization_percentage": round(min(100, (pending_hours / baseline_weekly) * 100)) if baseline_weekly > 0 else 0
        }

    @staticmethod
    def _calculate_hours(event: Dict[str, Any]) -> float:
        try:
            start = datetime.fromisoformat(event["start"].replace('Z', '+00:00'))
            end = datetime.fromisoformat(event["end"].replace('Z', '+00:00'))
            return (end - start).total_seconds() / 3600.0
        except Exception:
            return 0.0

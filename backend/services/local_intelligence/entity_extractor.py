import re
import dateparser
from typing import Dict, Any

class EntityExtractor:
    """
    Extracts structured entities (dates, times, names, priorities, projects, emails, URLs, numbers)
    from a normalized transcript.
    """
    
    @classmethod
    def extract(cls, transcript: str, intent: str, timezone: str = "UTC") -> Dict[str, Any]:
        entities = {}
        text_lower = transcript.lower()
        
        # 1. Standard Targets (Tasks/Goals)
        task_match = re.search(r'(?:add|create)(?:\s+a)?(?:\s+task)?\s+(?:to|for)?\s*(.*?)(?:\s+for|\s+tomorrow|\s+today|\s+next|$)', transcript, re.IGNORECASE)
        if task_match and task_match.group(1).strip() and task_match.group(1).strip().lower() not in ["task", "goal"]:
            entities["target_name"] = task_match.group(1).strip()
            
        goal_match = re.search(r'(?:add|create)(?:\s+a)?(?:\s+goal)?\s*(?:to|for)?\s*(.*?)(?:\s+by|\s+for|$)', transcript, re.IGNORECASE)
        if goal_match and not "target_name" in entities and goal_match.group(1).strip().lower() not in ["goal", "task"]:
            entities["target_name"] = goal_match.group(1).strip()
            
        # Meeting attendees ("with sir tayyab", "with John")
        if intent == "meeting_scheduling":
            with_match = re.search(
                r'\bwith\s+([a-zA-Z][a-zA-Z\s\.]+?)(?:\s+on|\s+at|\s+for|\s+13|\s+\d|$)',
                transcript, re.IGNORECASE
            )
            if with_match:
                entities["attendee"] = with_match.group(1).strip()
                # Also use as target_name if not set
                if not entities.get("target_name"):
                    entities["target_name"] = f"Meeting with {entities['attendee']}"

        # Navigation targets
        nav_match = re.search(r'(?:open|show|go to)\s+(dashboard|settings|goals|planner|calendar|rescue|analytics|documents|vision)', text_lower)
        if nav_match:
            entities["target_name"] = nav_match.group(1).capitalize()
            
        # Document/Vision targets
        doc_match = re.search(r'(?:analyze|read|process)\s+(?:this\s+)?(?:document|file)\s+([a-zA-Z0-9_\-\.]+)', text_lower)
        if doc_match:
            entities["document_name"] = doc_match.group(1)
            
        image_match = re.search(r'(?:analyze|what is in)\s+(?:this\s+)?(?:image|picture|photo)\s+([a-zA-Z0-9_\-\.]+)', text_lower)
        if image_match:
            entities["image_reference"] = image_match.group(1)

        # 2. Extract Dates/Times
        from dateparser.search import search_dates
        from datetime import datetime, timezone as tz, timedelta
        import pytz

        # ── Resolve user's local "now" in their timezone ──────────────────────
        try:
            user_tz = pytz.timezone(timezone)
        except Exception:
            user_tz = pytz.utc

        now_utc   = datetime.now(tz.utc)
        now_local = now_utc.astimezone(user_tz)

        # ── Step A: regex-extract explicit time first (most reliable) ──────────
        # Matches: "9pm", "9:30pm", "21:00", "9 pm", "9:00 PM"
        _TIME_RE = re.compile(
            r'\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b'
            r'|\b(\d{2}):(\d{2})\b',
            re.IGNORECASE
        )
        explicit_time = None
        for m in _TIME_RE.finditer(transcript):
            if m.group(3):                     # 12-h match
                hour   = int(m.group(1))
                minute = int(m.group(2) or 0)
                merid  = m.group(3).lower()
                if merid == "pm" and hour != 12:
                    hour += 12
                elif merid == "am" and hour == 12:
                    hour = 0
            else:                              # 24-h match
                hour   = int(m.group(4))
                minute = int(m.group(5))
            explicit_time = (hour, minute)
            break

        # ── Step B: dateparser resolves the date using user's local now ────────
        try:
            dates_found = search_dates(
                transcript,
                settings={
                    'PREFER_DATES_FROM':        'future',
                    'RELATIVE_BASE':            now_local.replace(tzinfo=None),  # naive local
                    'RETURN_AS_TIMEZONE_AWARE': False,
                    'PREFER_DAY_OF_MONTH':      'current',
                    'PREFER_MONTH_OF_YEAR':     'current',
                    'RETURN_TIME_AS_PERIOD':    False,
                    'TIMEZONE':                 timezone,
                }
            )
        except Exception:
            dates_found = None

        best_dt  = None   # naive local datetime
        best_raw = None

        if dates_found:
            for raw_str, dt in dates_found:
                if len(raw_str.strip()) <= 2:
                    continue
                if best_dt is None or (dt.hour != 0 and best_dt.hour == 0):
                    best_dt  = dt
                    best_raw = raw_str

        # ── Step C: overlay regex time onto parsed date ────────────────────────
        if best_dt is not None and explicit_time is not None:
            if best_dt.hour == 0 and best_dt.minute == 0:
                best_dt = best_dt.replace(
                    hour=explicit_time[0], minute=explicit_time[1],
                    second=0, microsecond=0
                )
        elif best_dt is None and explicit_time is not None:
            # No date found — use today in user's local timezone
            best_dt = now_local.replace(
                hour=explicit_time[0], minute=explicit_time[1],
                second=0, microsecond=0, tzinfo=None
            )
            # If that local time already passed, push to tomorrow
            if user_tz.localize(best_dt) < now_local:
                best_dt = best_dt + timedelta(days=1)
            best_raw = transcript

        # ── Step D: localise (user tz) → convert to UTC → store as UTC ISO ─────
        if best_dt is not None:
            try:
                local_aware = user_tz.localize(best_dt, is_dst=None)
            except Exception:
                local_aware = user_tz.localize(best_dt)
            utc_dt = local_aware.astimezone(pytz.utc)
            entities["target_date"]       = utc_dt.isoformat()        # UTC, stored in DB
            entities["target_date_raw"]   = best_raw or transcript
            entities["target_date_local"] = local_aware.isoformat()   # local, for voice_response
            
        # Extract Durations (e.g. "for 30 minutes")
        duration_match = re.search(r'for\s+(\d+)\s+(minute|hour|day)s?', text_lower)
        if duration_match:
            entities["duration"] = f"{duration_match.group(1)} {duration_match.group(2)}s"

        # 3. Extract Priority (high, medium, low)
        if re.search(r'\b(high|urgent)\s+priority\b', text_lower):
            entities["priority"] = "high"
        elif re.search(r'\b(low)\s+priority\b', text_lower):
            entities["priority"] = "low"
        elif re.search(r'\b(medium)\s+priority\b', text_lower):
            entities["priority"] = "medium"

        # 4. Utilities (Emails, URLs, Projects)
        email_match = re.search(r'[\w\.-]+@[\w\.-]+', transcript)
        if email_match:
            entities["email"] = email_match.group(0)
            
        url_match = re.search(r'https?://[^\s]+', transcript)
        if url_match:
            entities["url"] = url_match.group(0)
            
        project_match = re.search(r'in\s+(?:the\s+)?([a-zA-Z0-9\s]+)\s+project', text_lower)
        if project_match:
            entities["project_name"] = project_match.group(1).strip()
            
        # Numbers
        num_match = re.findall(r'\b\d+\b', transcript)
        if num_match:
            entities["numbers"] = [int(n) for n in num_match]

        return entities

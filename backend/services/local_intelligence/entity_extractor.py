import re
import dateparser
from typing import Dict, Any

class EntityExtractor:
    """
    Extracts structured entities (dates, times, names, priorities, projects, emails, URLs, numbers)
    from a normalized transcript.
    """
    
    @classmethod
    def extract(cls, transcript: str, intent: str) -> Dict[str, Any]:
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
        from datetime import datetime, timezone as tz
        now = datetime.now(tz.utc)
        try:
            dates_found = search_dates(
                transcript,
                settings={
                    'PREFER_DATES_FROM': 'future',
                    'RELATIVE_BASE': now.replace(tzinfo=None),   # naive base avoids year drift
                    'RETURN_AS_TIMEZONE_AWARE': False,
                    'PREFER_DAY_OF_MONTH': 'current',
                    'PREFER_MONTH_OF_YEAR': 'current',
                    'RETURN_TIME_AS_PERIOD': False,
                }
            )
        except Exception:
            dates_found = None

        if dates_found:
            # Pick the best match — prefer entries with a real time component
            # (skip pure words like "me" that dateparser sometimes misparses)
            best_dt = None
            best_raw = None
            for raw_str, dt in dates_found:
                # Skip if dateparser matched a noise word like "me", "a", etc.
                if len(raw_str.strip()) <= 2:
                    continue
                # Prefer entries that carry actual time info (not midnight default)
                if best_dt is None or (dt.hour != 0 and best_dt.hour == 0):
                    best_dt = dt
                    best_raw = raw_str

            if best_dt:
                # Attach UTC timezone
                aware_dt = best_dt.replace(tzinfo=tz.utc)
                entities["target_date"] = aware_dt.isoformat()
                entities["target_date_raw"] = best_raw
            
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

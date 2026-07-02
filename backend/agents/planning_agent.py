"""
DeadlineOS — Planning Agent
=============================
An elite AI Scheduling Engine that transforms prioritized tasks 
into actionable execution schedules with focus blocks.
"""

import json
import logging
import datetime
from typing import Dict, Any, List
from agents.hybrid_inference import execute_hybrid

logger = logging.getLogger(__name__)

PLANNING_SYSTEM_PROMPT = """You are the Planning Agent in DeadlineOS — an elite executive assistant responsible for ensuring every task is completed before deadlines.
Your goal is to transform prioritized tasks into a realistic, actionable execution schedule.

SCHEDULE RULES:
1. Highest priority score tasks should be scheduled first.
2. Tasks with the nearest deadline must be prioritized.
3. NEVER schedule overlapping tasks.
4. Respect the user's daily available hours and preferred work window.
5. Include short breaks between tasks to maintain productivity.
6. Designate critical, deep-work sessions as "focus_block": true.
7. Return a 'confidence_score' (0-100) estimating the probability of completing all scheduled tasks before their deadlines.

Output exactly according to the requested JSON schema."""

PLANNING_USER_PROMPT_TEMPLATE = """
TASKS TO SCHEDULE:
{tasks_json}

USER AVAILABILITY:
{availability_json}

Generate the optimal schedule.
"""

PLANNING_SCHEMA = {
    "type": "object",
    "properties": {
        "schedule": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "date": {"type": "string", "description": "YYYY-MM-DD format"},
                    "task": {"type": "string", "description": "Task title exactly as provided"},
                    "start_time": {"type": "string", "description": "HH:MM 24-hour format"},
                    "end_time": {"type": "string", "description": "HH:MM 24-hour format"},
                    "focus_block": {"type": "boolean", "description": "True if this requires deep uninterrupted focus"}
                },
                "required": ["date", "task", "start_time", "end_time", "focus_block"]
            }
        },
        "daily_summary": {
            "type": "string",
            "description": "A 1-2 sentence executive summary of the daily plan"
        },
        "confidence_score": {
            "type": "integer",
            "description": "0-100 score estimating probability of deadline success for this schedule"
        },
        "planning_brief": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "content": {"type": "string"},
                    "type": {"type": "string", "enum": ["optimization", "warning"]}
                }
            }
        },
        "twin_simulation": {
            "type": "object",
            "properties": {
                "impact_level": {"type": "string"},
                "risk_increase": {"type": "string"},
                "message": {"type": "string"}
            }
        },
        "backlog": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "string"},
                    "title": {"type": "string"},
                    "reason": {"type": "string"},
                    "suggested_day": {"type": "string"}
                }
            }
        }
    },
    "required": ["schedule", "daily_summary", "confidence_score", "planning_brief", "twin_simulation", "backlog"]
}

class PlanningAgent:
    """Agent responsible for transforming prioritized tasks into daily schedules."""
    
    def __init__(self, gemini_service):
        self.gemini = gemini_service

    def generate_plan(self, tasks: List[Dict[str, Any]], availability: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates an actionable daily execution schedule using Hybrid Inference.
        """
        if not tasks:
            return {
                "schedule": [],
                "daily_summary": "No tasks to schedule today. Take a break!",
                "confidence_score": 100,
                "_inference_source": "local"
            }

        def _gemini_inference():
            user_prompt = PLANNING_USER_PROMPT_TEMPLATE.format(
                tasks_json=json.dumps(tasks, indent=2),
                availability_json=json.dumps(availability, indent=2)
            )
            
            logger.info("Planning Agent (Gemini) generating schedule for %d tasks", len(tasks))
            return self.gemini.generate_structured(
                system_prompt=PLANNING_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                schema=PLANNING_SCHEMA,
                temperature=0.2
            )

        def _local_inference():
            daily_hours = float(availability.get("daily_available_hours", 8.0))
            break_duration_mins = int(availability.get("breakDuration", 15))
            strategy = availability.get("strategy", "Balanced")
            deep_work_focus = availability.get("deepWorkFocus", False)
            preferred_hours = availability.get("preferred_work_hours", {"start": "09:00", "end": "17:00"})
            
            # --- Phase 3A: Smart Scheduling Modes Heuristics ---
            max_chunk = 2.0 if deep_work_focus else 1.0
            
            if strategy == "Deep Work":
                deep_work_focus = True
                max_chunk = 2.0
                break_duration_mins = max(20, break_duration_mins)
            elif strategy == "Exam Mode":
                max_chunk = 1.5
                break_duration_mins = 10
            elif strategy == "Placement Mode":
                max_chunk = 2.0
                break_duration_mins = 15
            elif strategy == "Hackathon Mode":
                max_chunk = 3.0
                break_duration_mins = 10
                daily_hours = 16.0
            elif strategy == "Recovery Mode":
                max_chunk = 0.5
                break_duration_mins = max(15, break_duration_mins)
                daily_hours = min(4.0, daily_hours)

            start_hour, start_min = map(int, preferred_hours.get("start", "09:00").split(":"))
            end_hour, end_min = map(int, preferred_hours.get("end", "17:00").split(":"))
            
            current_time = datetime.datetime.now().replace(hour=start_hour, minute=start_min, second=0, microsecond=0)
            end_bound = current_time.replace(hour=end_hour, minute=end_min, second=0, microsecond=0)
            if end_bound <= current_time:
                end_bound += datetime.timedelta(days=1)
                
            today_str = current_time.strftime("%Y-%m-%d")
            
            def get_deadline_ts(t):
                dl = t.get("deadline")
                if dl and dl != "No deadline":
                    try:
                        return datetime.datetime.fromisoformat(dl.replace('Z', '+00:00')).timestamp()
                    except Exception:
                        pass
                return float('inf')

            def get_safe_hours(t):
                try:
                    val = float(t.get("estimated_hours", 1.0))
                    return val if val > 0 else 1.0
                except (ValueError, TypeError):
                    return 1.0

            def get_mode_priority(t):
                cat = t.get("category", "").lower()
                base_score = float(t.get("priority_score", 0))
                if strategy == "Exam Mode" and "study" in cat:
                    return base_score + 100
                elif strategy == "Placement Mode" and ("work" in cat or "prep" in cat):
                    return base_score + 100
                elif strategy == "Hackathon Mode":
                    return base_score * 1.5
                return base_score

            sorted_tasks = sorted(tasks, key=lambda x: (
                get_deadline_ts(x),
                -get_mode_priority(x), 
                -get_safe_hours(x) if deep_work_focus else 0
            ))
            
            schedule = []
            backlog = []
            total_hours_assigned = 0.0
            
            # --- Phase 3A: Deep Work Chunking ---
            for task in sorted_tasks:
                if strategy == "Recovery Mode" and float(task.get("priority_score", 0)) > 80:
                    backlog.append({
                        "task_id": task.get("id"),
                        "title": task.get("title", "Untitled Task"),
                        "reason": "Recovery Mode limits high-stress items",
                        "suggested_day": "Later"
                    })
                    continue

                est_hrs = get_safe_hours(task)
                remaining_hrs = est_hrs
                chunk_index = 1
                
                while remaining_hrs > 0:
                    chunk_hrs = min(remaining_hrs, max_chunk)
                    is_deep_work = chunk_hrs >= 2.0 or deep_work_focus
                    
                    task_duration = datetime.timedelta(hours=chunk_hrs)
                    projected_end = current_time + task_duration
                    
                    if total_hours_assigned + chunk_hrs > daily_hours or projected_end > end_bound:
                        title_str = task.get("title", "Untitled Task")
                        if est_hrs > max_chunk:
                            title_str += f" (Remaining {remaining_hrs}h)"
                        backlog.append({
                            "task_id": task.get("id"),
                            "title": title_str,
                            "reason": "Exceeds daily capacity limit",
                            "suggested_day": "Tomorrow"
                        })
                        break
                    
                    start_str = current_time.strftime("%H:%M")
                    end_str = projected_end.strftime("%H:%M")
                    
                    title = task.get("title", "Untitled Task")
                    if est_hrs > max_chunk:
                        title += f" (Part {chunk_index})"
                    
                    schedule.append({
                        "date": today_str,
                        "task_id": task.get("id"),
                        "task": title,
                        "start_time": start_str,
                        "end_time": end_str,
                        "focus_block": is_deep_work
                    })
                    
                    total_hours_assigned += chunk_hrs
                    current_time = projected_end
                    remaining_hrs -= chunk_hrs
                    chunk_index += 1
                    
                    break_duration = datetime.timedelta(minutes=break_duration_mins)
                    if (current_time + break_duration <= end_bound and remaining_hrs > 0) or current_time < end_bound:
                        break_end = current_time + break_duration
                        if break_end <= end_bound:
                            schedule.append({
                                "date": today_str,
                                "task_id": None,
                                "task": f"{break_duration_mins}-Min Break",
                                "start_time": current_time.strftime("%H:%M"),
                                "end_time": break_end.strftime("%H:%M"),
                                "focus_block": False
                            })
                            current_time = break_end

            confidence_score = 100
            sys_confidence = 100
            
            planning_brief = [
                {"title": "Strategy Applied", "content": f"Optimized for {strategy} execution.", "type": "optimization"}
            ]
            
            if len(backlog) > 0:
                planning_brief.append({
                    "title": "Capacity Warning", 
                    "content": f"{len(backlog)} tasks pushed to backlog to protect focus.", 
                    "type": "warning"
                })
                confidence_score -= (len(backlog) * 5)
                if len(backlog) >= 3:
                    sys_confidence = 60
                else:
                    sys_confidence = 80
            
            # --- Phase 3B: Local Twin Forecast Integration ---
            total_est = sum([get_safe_hours(t) for t in tasks])
            projected_prob = 100
            if total_est > daily_hours:
                projected_prob = max(0, 100 - int((total_est - daily_hours) * 10))
            
            risk_level = "Low"
            if projected_prob < 50:
                risk_level = "Critical"
            elif projected_prob < 70:
                risk_level = "High"
            elif projected_prob < 90:
                risk_level = "Medium"

            twin_simulation = {
                "impact_level": risk_level.upper(),
                "risk_increase": f"+{len(backlog) * 10}%" if len(backlog) > 0 else "0%",
                "message": f"Forecast: {projected_prob}% deadline success probability."
            }

            # --- Phase 3B: Local Rescue Integration ---
            capacity_utilized = (total_hours_assigned / daily_hours) * 100 if daily_hours > 0 else 0
            if capacity_utilized > 95 or len(backlog) > 3:
                planning_brief.append({
                    "title": "Rescue Plan Active",
                    "content": "Workload exceeds safe margins. Recommend deferring low priority tasks and extending medium priority deadlines.",
                    "type": "warning"
                })
                if sys_confidence > 70:
                    sys_confidence = 70 # Encourage Gemini fallback if desired, but we keep local active

            return {
                "schedule": schedule,
                "daily_summary": f"Scheduled {len([s for s in schedule if not s.get('is_break') and s.get('task_id')])} blocks. {len(backlog)} in backlog.",
                "confidence_score": max(0, confidence_score),
                "_system_confidence": sys_confidence,
                "planning_brief": planning_brief,
                "twin_simulation": twin_simulation,
                "backlog": backlog
            }

        return execute_hybrid(_local_inference, _gemini_inference, threshold=75)

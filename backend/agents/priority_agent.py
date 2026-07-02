"""
DeadlineOS — Priority Agent
=============================
Analyzes tasks using Gemini to determine urgency, importance, 
estimated effort, risk of delay, and a priority score.
"""

import datetime
import logging
from typing import Dict, Any
from agents.hybrid_inference import execute_hybrid

logger = logging.getLogger(__name__)

PRIORITY_SYSTEM_PROMPT = """You are the Priority Agent in DeadlineOS, an AI Chief-of-Staff system.
Analyze the given task and return a precise priority assessment as structured JSON.
Consider: Eisenhower Matrix (urgency × importance), deadline proximity, effort required, and downstream dependencies.
Always reason step-by-step before outputting the final JSON."""

PRIORITY_USER_PROMPT_TEMPLATE = """
Task: {title}
Description: {description}
Deadline: {deadline} (current time: {now})
Estimated Hours: {estimated_hours}
Current workload: {active_tasks_count} tasks pending

Return this EXACT JSON structure:
{{
  "priority_score": <0-100 integer>,
  "urgency": "<High|Medium|Low>",
  "importance": "<High|Medium|Low>",
  "estimated_hours": <number>,
  "risk_level": "<High|Medium|Low>",
  "reasoning": "<1-2 sentence explanation>"
}}
"""

PRIORITY_SCHEMA = {
    "type": "object",
    "properties": {
        "priority_score": {"type": "integer", "description": "0-100 score based on urgency and importance"},
        "urgency": {"type": "string", "enum": ["High", "Medium", "Low"]},
        "importance": {"type": "string", "enum": ["High", "Medium", "Low"]},
        "estimated_hours": {"type": "number", "description": "Estimated hours to complete"},
        "risk_level": {"type": "string", "enum": ["High", "Medium", "Low"]},
        "reasoning": {"type": "string", "description": "Brief reasoning for the priority score"}
    },
    "required": ["priority_score", "urgency", "importance", "estimated_hours", "risk_level", "reasoning"]
}

class PriorityAgent:
    """Agent responsible for analyzing tasks and calculating priority metrics."""
    
    def __init__(self, gemini_service):
        self.gemini = gemini_service

    def analyze_task(self, task_data: Dict[str, Any], active_tasks_count: int = 0) -> Dict[str, Any]:
        """
        Analyzes task urgency, importance, risk, and priority score using Hybrid Inference.
        """
        def _gemini_inference():
            title = task_data.get("title", "Untitled Task")
            description = task_data.get("description", "No description provided")
            deadline = task_data.get("deadline", "No deadline")
            estimated_hours = task_data.get("estimated_hours", 1.0)
            
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            
            user_prompt = PRIORITY_USER_PROMPT_TEMPLATE.format(
                title=title,
                description=description,
                deadline=deadline,
                now=now,
                estimated_hours=estimated_hours,
                active_tasks_count=active_tasks_count
            )
            
            logger.info("Priority Agent (Gemini) analyzing task: %s", title)
            return self.gemini.generate_structured(
                system_prompt=PRIORITY_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                schema=PRIORITY_SCHEMA,
                temperature=0.2
            )

        def _local_inference():
            title = task_data.get("title", "Untitled Task")
            description = task_data.get("description", "")
            deadline_str = task_data.get("deadline")
            estimated_hours = float(task_data.get("estimated_hours", 1.0))
            
            urgency_score = 10
            urgency_label = "Low"
            has_deadline = False
            
            if deadline_str and deadline_str != "No deadline":
                has_deadline = True
                try:
                    # Parse deadline (could be ISO format)
                    deadline_dt = datetime.datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
                    now_dt = datetime.datetime.now(datetime.timezone.utc)
                    delta = deadline_dt - now_dt
                    hours_left = delta.total_seconds() / 3600.0
                    
                    if hours_left < 24:
                        urgency_score = 50
                        urgency_label = "High"
                    elif hours_left < 24 * 7:
                        urgency_score = 30
                        urgency_label = "Medium"
                except Exception:
                    pass

            text_to_analyze = (title + " " + description).lower()
            high_keywords = ["asap", "urgent", "critical", "blocker", "client", "production", "immediately"]
            medium_keywords = ["soon", "important", "review", "bug", "fix"]
            
            importance_score = 10
            importance_label = "Low"
            
            if any(k in text_to_analyze for k in high_keywords):
                importance_score = 30
                importance_label = "High"
            elif any(k in text_to_analyze for k in medium_keywords):
                importance_score = 20
                importance_label = "Medium"
                
            risk_score = 10
            risk_label = "Low"
            if estimated_hours > 8:
                risk_score = 20
                risk_label = "High"
            elif estimated_hours > 4:
                risk_score = 15
                risk_label = "Medium"
                
            total_priority = urgency_score + importance_score + risk_score
            # Normalize to 0-100 just in case
            total_priority = min(100, max(0, total_priority))
            
            # Confidence calculation
            # If no deadline and no strong keywords, we lack deterministic signals
            confidence = 100
            if not has_deadline:
                if importance_label == "Low":
                    confidence = 80
                else:
                    confidence = 90
            
            return {
                "priority_score": total_priority,
                "urgency": urgency_label,
                "importance": importance_label,
                "estimated_hours": estimated_hours,
                "risk_level": risk_label,
                "reasoning": f"Calculated based on {urgency_label} urgency and {importance_label} importance.",
                "_system_confidence": confidence
            }

        return execute_hybrid(_local_inference, _gemini_inference, threshold=80)

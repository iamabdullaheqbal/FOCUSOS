"""
DeadlineOS — Accountability Agent
=================================
Analyzes historical task data to generate productivity metrics.
"""

from typing import Dict, Any, List
import json

class AccountabilityAgent:
    def __init__(self, ai_service):
        self.ai_service = ai_service

    def _get_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "completion_rate": {"type": "integer", "description": "0-100 score of tasks completed vs total"},
                "consistency_score": {"type": "integer", "description": "0-100 score representing regular work habits"},
                "procrastination_score": {"type": "integer", "description": "0-100 score representing delay tendencies"},
                "productivity_score": {"type": "integer", "description": "0-100 aggregate metric"},
                "risk_profile": {"type": "string", "description": "A short phrase describing the user's risk (e.g., 'High Procrastination Risk')"},
                "key_findings": {"type": "array", "items": {"type": "string"}, "description": "2-3 insights about their behavior"},
                "recommendations": {"type": "array", "items": {"type": "string"}, "description": "2-3 actionable tips"}
            },
            "required": ["completion_rate", "consistency_score", "procrastination_score", "productivity_score", "risk_profile", "key_findings", "recommendations"]
        }

    def generate_metrics(self, active_tasks: List[Dict[str, Any]], completed_tasks: List[Dict[str, Any]], overdue_tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyzes task execution and stores/returns metrics."""
        system_prompt = "You are the DeadlineOS Accountability Agent. Generate a brutal but fair accountability report. Calculate metrics out of 100."
        user_prompt = f"""
Active Tasks: {json.dumps(active_tasks)}
Completed Tasks: {json.dumps(completed_tasks)}
Overdue Tasks: {json.dumps(overdue_tasks)}
"""
        response_data = self.ai_service.generate_structured(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            schema=self._get_schema(),
        )
        
        # Save to DB
        try:
            from models.intelligence import AccountabilityMetrics
            from sqlalchemy import create_engine
            from sqlalchemy.orm import Session
            from config import settings
            sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
            engine = create_engine(sync_url, pool_pre_ping=True, pool_size=2)
            with Session(engine) as session:
                metrics = AccountabilityMetrics(
                    user_id=None,
                    completion_rate=response_data.get("completion_rate", 0),
                    consistency_score=response_data.get("consistency_score", 0),
                    procrastination_score=response_data.get("procrastination_score", 0),
                    productivity_score=response_data.get("productivity_score", 0),
                    risk_profile=response_data.get("risk_profile", "Unknown"),
                    key_findings=response_data.get("key_findings", []),
                    recommendations=response_data.get("recommendations", [])
                )
                session.add(metrics)
                session.commit()
                response_data["id"] = metrics.id
            engine.dispose()
        except Exception:
            pass
            
        return response_data

"""
DeadlineOS — Coach Agent
========================
Acts as a personal productivity coach based on accountability metrics and tasks.
"""

from typing import Dict, Any, List
import json

class CoachAgent:
    def __init__(self, ai_service):
        self.ai_service = ai_service

    def _get_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "strengths": {"type": "array", "items": {"type": "string"}, "description": "What the user does well"},
                "weaknesses": {"type": "array", "items": {"type": "string"}, "description": "Areas needing improvement"},
                "insights": {"type": "array", "items": {"type": "string"}, "description": "Deep productivity insights"},
                "improvement_plan": {"type": "array", "items": {"type": "string"}, "description": "Step-by-step plan"},
                "weekly_challenge": {"type": "string", "description": "A specific, tailored challenge for this week"},
                "recommendations": {"type": "array", "items": {"type": "string"}, "description": "Actionable advice"}
            },
            "required": ["strengths", "weaknesses", "insights", "improvement_plan", "weekly_challenge", "recommendations"]
        }

    def generate_coaching(self, active_tasks: List[Dict], metrics: Dict) -> Dict[str, Any]:
        """Provides coaching insights based on metrics and current workload."""
        system_prompt = "You are the DeadlineOS Coach Agent. Act as an elite personal productivity coach. Be motivating but demanding."
        user_prompt = f"""
Active Workload: {json.dumps(active_tasks)}
Accountability Metrics: {json.dumps(metrics)}
"""
        response_data = self.ai_service.generate_structured(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            schema=self._get_schema(),
        )
        
        try:
            from models.intelligence import CoachReport
            from sqlalchemy import create_engine
            from sqlalchemy.orm import Session
            from config import settings
            sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
            engine = create_engine(sync_url, pool_pre_ping=True, pool_size=2)
            with Session(engine) as session:
                report = CoachReport(
                    user_id=None,
                    strengths=response_data.get("strengths", []),
                    weaknesses=response_data.get("weaknesses", []),
                    insights=response_data.get("insights", []),
                    improvement_plan=response_data.get("improvement_plan", []),
                    weekly_challenge=response_data.get("weekly_challenge", ""),
                    recommendations=response_data.get("recommendations", [])
                )
                session.add(report)
                session.commit()
                response_data["id"] = report.id
            engine.dispose()
        except Exception:
            pass
            
        return response_data

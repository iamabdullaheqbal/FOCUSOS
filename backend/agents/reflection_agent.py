"""
DeadlineOS — Reflection Agent
=============================
Generates daily reflections summarizing achievements and missed opportunities.
"""

from typing import Dict, Any, List
from database.db import db
import json

class ReflectionAgent:
    def __init__(self, ai_service):
        self.ai_service = ai_service

    def _get_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "achievements": {"type": "array", "items": {"type": "string"}, "description": "Wins for the day"},
                "missed_opportunities": {"type": "array", "items": {"type": "string"}, "description": "What went wrong"},
                "lessons_learned": {"type": "array", "items": {"type": "string"}, "description": "Takeaways for tomorrow"},
                "tomorrow_priorities": {"type": "array", "items": {"type": "string"}, "description": "What to focus on tomorrow"},
                "daily_summary": {"type": "string", "description": "A 2-sentence overarching summary of the day"}
            },
            "required": ["achievements", "missed_opportunities", "lessons_learned", "tomorrow_priorities", "daily_summary"]
        }

    def generate_reflection(self, tasks: List[Dict], twin_simulation: Dict) -> Dict[str, Any]:
        """Provides an end-of-day reflection."""
        prompt = f"""
        You are the DeadlineOS Reflection Agent.
        
        Current Tasks & Workload: {json.dumps(tasks)}
        Future Simulation Outcomes (Digital Twin): {json.dumps(twin_simulation)}
        
        Write a concise, high-impact daily reflection report for the user. Focus on what they achieved, what they missed, and what tomorrow demands based on the Twin's simulation.
        """
        
        response_data = self.ai_service.generate_structured(prompt, self._get_schema())
        
        try:
            from models.intelligence import ReflectionReport
            from sqlalchemy import create_engine
            from sqlalchemy.orm import Session
            from config import settings
            sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
            engine = create_engine(sync_url, pool_pre_ping=True, pool_size=2)
            with Session(engine) as session:
                report = ReflectionReport(
                    user_id=None,
                    achievements=response_data.get("achievements", []),
                    missed_opportunities=response_data.get("missed_opportunities", []),
                    lessons_learned=response_data.get("lessons_learned", []),
                    tomorrow_priorities=response_data.get("tomorrow_priorities", []),
                    daily_summary=response_data.get("daily_summary", "")
                )
                session.add(report)
                session.commit()
                response_data["id"] = report.id
            engine.dispose()
        except Exception:
            pass
            
        return response_data

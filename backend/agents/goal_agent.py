"""
DeadlineOS — Goal Agent
=======================
Analyzes long-term goals and generates milestones, blockers, and forecasts.
"""

from typing import Dict, Any, List
from services.gemini_service import GeminiService
from models.goal import Goal, Habit
from agents.hybrid_inference import execute_hybrid
import json
import logging

logger = logging.getLogger(__name__)

class GoalAgent:
    
    def __init__(self, gemini_service):
        self.gemini = gemini_service

    def analyze_goal(self, title: str, description: str) -> Dict[str, Any]:
        """Analyzes a new or existing goal using Hybrid Inference."""
        
        def _gemini_inference():
            prompt = f"""
            You are the Goal Agent for an AI Productivity Operating System.
            Analyze the following goal:
            Title: {title}
            Description: {description}

            Generate a structured response with:
            1. goal_health (String: "Excellent", "Good", "At Risk", "Critical")
            2. completion_probability (Integer 0-100)
            3. milestones (Array of Strings: 3-5 logical checkpoints)
            4. blockers (Array of Strings: potential risks)
            5. recommendations (Array of Strings: actionable advice)
            """
            
            schema = {
                "type": "OBJECT",
                "properties": {
                    "goal_health": {"type": "STRING"},
                    "completion_probability": {"type": "INTEGER"},
                    "milestones": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"}
                    },
                    "blockers": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"}
                    },
                    "recommendations": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"}
                    }
                },
                "required": ["goal_health", "completion_probability", "milestones", "blockers", "recommendations"]
            }
            logger.info("Goal Agent (Gemini) analyzing goal '%s'", title)
            return self.gemini.generate_structured(prompt, f"{title} {description}", schema)

        def _local_inference():
            title_lower = title.lower()
            desc_lower = description.lower()
            combined = title_lower + " " + desc_lower
            
            # Deterministic local milestone templates
            templates = {
                "software": ["Define project scope & architecture", "Setup repository & environment", "Develop MVP features", "Testing & debugging", "Deployment & documentation"],
                "hackathon": ["Ideation & team formation", "Prototype core mechanic", "Refine UI/UX", "Final presentation prep"],
                "placement": ["Resume & LinkedIn polish", "Data Structures & Algorithms practice", "Mock Interviews", "Apply to target companies"],
                "exam": ["Gather syllabus & materials", "First pass study phase", "Past papers & mock tests", "Final revision"],
                "internship": ["Update portfolio", "Research target companies", "Send cold emails/applications", "Interview preparation"],
                "portfolio": ["Select best projects", "Write case studies", "Design website layout", "Deploy and share"],
                "ai": ["Data gathering & cleaning", "Model selection & training", "Evaluation & tuning", "Inference API creation"],
                "startup": ["Market research & validation", "Customer interviews", "Build MVP", "Launch & iterate"]
            }
            
            matched_template = None
            if "software" in combined or "app" in combined or "dev" in combined:
                matched_template = templates["software"]
            elif "hackathon" in combined:
                matched_template = templates["hackathon"]
            elif "placement" in combined or "job" in combined:
                matched_template = templates["placement"]
            elif "exam" in combined or "study" in combined:
                matched_template = templates["exam"]
            elif "internship" in combined:
                matched_template = templates["internship"]
            elif "portfolio" in combined:
                matched_template = templates["portfolio"]
            elif "ai" in combined or "machine learning" in combined:
                matched_template = templates["ai"]
            elif "startup" in combined or "business" in combined:
                matched_template = templates["startup"]
                
            confidence = 100 if matched_template else 60
            
            return {
                "goal_health": "Excellent",
                "completion_probability": 90 if matched_template else 70,
                "milestones": matched_template or ["Define objective", "Break into sub-tasks", "Begin execution"],
                "blockers": ["Procrastination", "Scope creep"],
                "recommendations": ["Execute the generated tasks in the Planner."],
                "_system_confidence": confidence
            }

        return execute_hybrid(_local_inference, _gemini_inference, threshold=75)

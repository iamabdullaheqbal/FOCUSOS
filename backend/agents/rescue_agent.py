"""
DeadlineOS — Rescue Agent
=============================
An emergency productivity strategist whose sole objective is 
preventing deadline failure by analyzing risks and generating 
actionable recovery plans (Safe, Balanced, Aggressive).
"""

import json
import logging
import datetime
from typing import Dict, Any, List
from agents.hybrid_inference import execute_hybrid

logger = logging.getLogger(__name__)

class RescueAgent:
    """Agent responsible for detecting deadline risks and formulating recovery strategies."""
    
    def __init__(self, gemini_service):
        self.gemini = gemini_service

    def generate_recovery_plan(self, tasks: List[Dict[str, Any]], availability: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates 3 distinct recovery strategies (Safe, Balanced, Aggressive)
        validated against the Digital Twin.
        """
        if not tasks:
            return {
                "risk_detected": False,
                "risk_level": "None",
                "strategies": [],
                "reasoning": "No active tasks.",
                "_inference_source": "local"
            }

        daily_hours = availability.get("daily_available_hours", 8)
        total_est = sum([float(t.get("estimated_hours", 1.0)) for t in tasks])
        
        risk_detected = total_est > daily_hours
        risk_level = "None"
        if risk_detected:
            risk_level = "High" if total_est > daily_hours * 1.5 else "Medium"

        if not risk_detected:
            return {
                "risk_detected": False,
                "risk_level": "None",
                "strategies": [],
                "reasoning": "Workload is well within daily capacity.",
                "_inference_source": "local"
            }

        from agents.digital_twin_agent import DigitalTwinAgent
        twin = DigitalTwinAgent(self.gemini)

        def _local_inference():
            # Sort tasks by size
            sorted_tasks = sorted(tasks, key=lambda x: float(x.get("estimated_hours", 1.0)), reverse=True)
            largest_task = sorted_tasks[0]
            second_largest = sorted_tasks[1] if len(sorted_tasks) > 1 else None

            # Candidate 1: Defer Largest Task (Safe)
            c1_scenario = {"action": "DELAY_TASK", "task_id": largest_task.get("id"), "delay_days": 2}
            c1_res = twin.simulate_scenario(tasks, c1_scenario, availability)

            # Candidate 2: Defer Top 2 Tasks (Safest)
            c2_scenario = {"action": "REDUCE_HOURS", "hours": 4} # simulate heavy reduction to force deferral
            c2_res = twin.simulate_scenario(tasks, c2_scenario, availability)
            
            # Candidate 3: Defer Largest 1 day (Balanced)
            c3_scenario = {"action": "DELAY_TASK", "task_id": largest_task.get("id"), "delay_days": 1}
            c3_res = twin.simulate_scenario(tasks, c3_scenario, availability)
            
            # Candidate 4: Defer second largest (Balanced alternative)
            c4_scenario = {"action": "DELAY_TASK", "task_id": second_largest.get("id") if second_largest else largest_task.get("id"), "delay_days": 1}
            c4_res = twin.simulate_scenario(tasks, c4_scenario, availability)
            
            # Candidate 5: Add Hours (Aggressive)
            c5_scenario = {"action": "REDUCE_HOURS", "hours": -2} # Negative reduction = add hours
            c5_res = twin.simulate_scenario(tasks, c5_scenario, availability)

            # Assemble Strategies
            strategies = [
                {
                    "name": "Safe",
                    "success_prob": c1_res.get("projected_state", {}).get("success_probability", 80),
                    "actions": [
                        {"action": "DEFER_TASK", "task_id": largest_task.get("id"), "delay_days": 2, "description": f"Defer '{largest_task.get('title')}' by 2 days."},
                        {"action": "PAUSE_HABITS", "description": "Pause non-essential habits."}
                    ],
                    "impact": "Maximum relief. Significant delays."
                },
                {
                    "name": "Balanced",
                    "success_prob": c3_res.get("projected_state", {}).get("success_probability", 70),
                    "actions": [
                        {"action": "DEFER_TASK", "task_id": largest_task.get("id"), "delay_days": 1, "description": f"Defer '{largest_task.get('title')}' by 1 day."},
                        {"action": "MAINTAIN_HABITS", "description": "Keep habits active."}
                    ],
                    "impact": "Moderate relief. 1-day delay on largest item."
                },
                {
                    "name": "Aggressive",
                    "success_prob": c5_res.get("projected_state", {}).get("success_probability", 60),
                    "actions": [
                        {"action": "INJECT_FOCUS", "description": "Inject +2 hours of Focus Blocks."},
                        {"action": "MAINTAIN_HABITS", "description": "Keep habits active."}
                    ],
                    "impact": "No delays. Requires working overtime."
                }
            ]
            
            # If risk is extremely high, drop confidence to trigger Gemini enhancement
            sys_confidence = 100
            if risk_level == "High":
                sys_confidence = 60

            return {
                "risk_detected": True,
                "risk_level": risk_level,
                "strategies": strategies,
                "reasoning": f"Workload exceeds capacity ({total_est}h > {daily_hours}h). Evaluated 5 Twin Scenarios, selected top 3.",
                "_system_confidence": sys_confidence
            }
            
        def _gemini_inference():
            local_plan = _local_inference()
            
            sys_prompt = "You are the Rescue Agent. Your role is NOT to generate strategies, but to explain and coach based on the provided Local Intelligence plan."
            user_prompt = f"""
LOCAL ENGINE PLAN:
{json.dumps(local_plan, indent=2)}

Enhance this plan by adding a 'coaching_advice' string to each strategy explaining why it was chosen and providing motivation.
Return the EXACT same strategies array, but append a 'coaching_advice' key to each strategy object.
Also update the 'reasoning' field to be more empathetic. Keep risk_detected and risk_level exactly the same.
            """
            
            schema = {
                "type": "object",
                "properties": {
                    "risk_detected": {"type": "boolean"},
                    "risk_level": {"type": "string"},
                    "reasoning": {"type": "string"},
                    "strategies": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "success_prob": {"type": "integer"},
                                "impact": {"type": "string"},
                                "actions": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "action": {"type": "string"},
                                            "description": {"type": "string"},
                                            "task_id": {"type": "string"},
                                            "delay_days": {"type": "integer"}
                                        },
                                        "required": ["action", "description"]
                                    }
                                },
                                "coaching_advice": {"type": "string"}
                            },
                            "required": ["name", "success_prob", "impact", "actions", "coaching_advice"]
                        }
                    }
                },
                "required": ["risk_detected", "risk_level", "reasoning", "strategies"]
            }
            
            return self.gemini.generate_structured(
                system_prompt=sys_prompt,
                user_prompt=user_prompt,
                schema=schema,
                temperature=0.4
            )
            
        return execute_hybrid(_local_inference, _gemini_inference, threshold=75)


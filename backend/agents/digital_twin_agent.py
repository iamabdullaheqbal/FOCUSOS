"""
DeadlineOS — Digital Twin Agent
=============================
A predictive productivity strategist capable of forecasting future 
consequences before decisions are made. Simulates scenarios like 
delaying tasks, reducing hours, or adding new work to predict risks 
and recommend alternative actions.
"""

import json
import logging
from typing import Dict, Any, List
from agents.hybrid_inference import execute_hybrid

logger = logging.getLogger(__name__)

TWIN_SYSTEM_PROMPT = """You are the Digital Twin Agent in DeadlineOS — a predictive productivity strategist capable of forecasting future consequences before decisions are made.
Your goal is to simulate future workloads, project risks, forecast deadline failures, and predict productivity outcomes based on hypothetical scenarios.

CORE RESPONSIBILITIES:
1. Forecast Future Risks: Project the impact of the proposed scenario on the schedule.
2. Predict Failures: Estimate how many deadlines will be missed due to this change.
3. Calculate Stress & Productivity: Generate quantitative scores (0-100) reflecting the simulated state.
4. Provide Alternatives: If a scenario is destructive, generate a concrete alternative plan.

Output exactly according to the requested JSON schema."""

TWIN_USER_PROMPT_TEMPLATE = """
CURRENT TASKS:
{tasks_json}

CURRENT AVAILABILITY:
{availability_json}

WHAT-IF SCENARIO:
{scenario_json}

Analyze the cascading effects of this scenario and output the predictive simulation results.
"""

TWIN_SCHEMA = {
    "type": "object",
    "properties": {
        "current_state": {
            "type": "object",
            "properties": {
                "success_probability": {"type": "integer"},
                "risk_score": {"type": "integer"}
            },
            "required": ["success_probability", "risk_score"]
        },
        "projected_state": {
            "type": "object",
            "properties": {
                "success_probability": {"type": "integer"},
                "risk_level": {"type": "string", "enum": ["Critical", "High", "Medium", "Low"]},
                "risk_score": {"type": "integer"}
            },
            "required": ["success_probability", "risk_level", "risk_score"]
        },
        "cascade": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "step": {"type": "string"},
                    "desc": {"type": "string"}
                },
                "required": ["step", "desc"]
            }
        },
        "risk_factors": {
            "type": "array",
            "items": {"type": "string"}
        },
        "recommendations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "action": {"type": "string"},
                    "confidence": {"type": "integer"}
                },
                "required": ["action", "confidence"]
            }
        },
        "success_probability": {"type": "integer"},
        "schedule_stability": {"type": "integer"},
        "capacity_impact": {"type": "integer"}
    },
    "required": [
        "current_state", "projected_state", "cascade", 
        "risk_factors", "recommendations", "success_probability", 
        "schedule_stability", "capacity_impact"
    ]
}

class DigitalTwinAgent:
    """Agent responsible for predictive simulations and what-if analysis."""
    
    def __init__(self, gemini_service):
        self.gemini = gemini_service

    def simulate_scenario(self, tasks: List[Dict[str, Any]], scenario: Dict[str, Any], availability: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simulates the outcome of a what-if scenario on the user's workload using Hybrid Inference.
        """
        if not tasks and not scenario:
            return {
                "current_state": {"success_probability": 100, "risk_score": 0},
                "projected_state": {"success_probability": 100, "risk_level": "Low", "risk_score": 0},
                "cascade": [],
                "risk_factors": [],
                "recommendations": [{"action": "You are free to take on new work.", "confidence": 100}],
                "success_probability": 100,
                "schedule_stability": 100,
                "capacity_impact": 0,
                "_inference_source": "local"
            }

        def _local_inference():
            action = scenario.get("action", "")
            sys_confidence = 100
            
            # Phase 5A: Clone Planner State & Run True Simulation
            from agents.planning_agent import PlanningAgent
            import copy
            import datetime
            
            planner = PlanningAgent(self.gemini)
            
            # 1. Generate Baseline
            baseline_plan = planner.generate_plan(tasks, availability)
            baseline_prob = baseline_plan.get("confidence_score", 100)
            baseline_backlog_len = len(baseline_plan.get("backlog", []))
            
            # 2. Clone State
            cloned_tasks = copy.deepcopy(tasks)
            cloned_availability = copy.deepcopy(availability)
            
            # 3. Inject Scenario Mutation
            if action == "DELAY_TASK":
                task_id = scenario.get("task_id")
                delay_days = float(scenario.get("delay_days", 1))
                for t in cloned_tasks:
                    if t.get("id") == task_id or t.get("title") == scenario.get("title"):
                        dl_str = t.get("deadline")
                        if dl_str and dl_str != "No deadline":
                            try:
                                dl = datetime.datetime.fromisoformat(dl_str.replace('Z', '+00:00'))
                                t["deadline"] = (dl + datetime.timedelta(days=delay_days)).isoformat()
                            except Exception:
                                pass
            elif action == "ADD_TASK":
                cloned_tasks.append({
                    "id": "scenario_injected_id",
                    "title": scenario.get("title", "Scenario Task"),
                    "estimated_hours": float(scenario.get("estimated_hours", 2)),
                    "priority_score": 80,
                    "deadline": (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)).isoformat()
                })
            elif action == "REDUCE_HOURS":
                hrs = float(cloned_availability.get("daily_available_hours", 8))
                cloned_availability["daily_available_hours"] = max(1.0, hrs - float(scenario.get("hours", 2)))
            else:
                sys_confidence = 50 # Semantic scenario, fallback to Gemini
                
            # 4. Generate Simulated Schedule
            projected_plan = planner.generate_plan(cloned_tasks, cloned_availability)
            projected_prob = projected_plan.get("confidence_score", 100)
            projected_backlog_len = len(projected_plan.get("backlog", []))
            
            # 5. Calculate Risk & Deltas
            capacity_impact = max(0, (projected_backlog_len - baseline_backlog_len) * 20)
            if projected_prob < baseline_prob:
                capacity_impact += (baseline_prob - projected_prob)
                
            risk_level = "Low"
            if projected_prob < 50:
                risk_level = "Critical"
            elif projected_prob < 70:
                risk_level = "High"
            elif projected_prob < 90:
                risk_level = "Medium"
                
            # Generate concrete recommendations based on delta
            recs = []
            if projected_prob < baseline_prob:
                recs.append({"action": f"Defer low priority tasks to restore {baseline_prob - projected_prob}% success rate.", "confidence": 90})
            if projected_backlog_len > baseline_backlog_len:
                recs.append({"action": f"Split oversized tasks into 2 sessions to clear {projected_backlog_len - baseline_backlog_len} backlog items.", "confidence": 85})
            if not recs:
                recs.append({"action": "Proceed with scenario. Schedule remains stable.", "confidence": 95})

            return {
                "current_state": {
                    "success_probability": baseline_prob,
                    "risk_score": 100 - baseline_prob
                },
                "projected_state": {
                    "success_probability": projected_prob,
                    "risk_level": risk_level,
                    "risk_score": 100 - projected_prob
                },
                "cascade": [
                    {"step": "Schedule Cloned", "desc": f"Simulation initialized with {len(cloned_tasks)} tasks"},
                    {"step": "Scenario Injected", "desc": f"Action: {action}"},
                    {"step": "Engine Simulation", "desc": f"Planner generated simulated schedule. Backlog Δ: {projected_backlog_len - baseline_backlog_len}"}
                ],
                "risk_factors": [
                    "Schedule compression" if projected_prob < baseline_prob else "Stable capacity",
                    f"Backlog grew by {projected_backlog_len - baseline_backlog_len}" if projected_backlog_len > baseline_backlog_len else "No backlog impact"
                ],
                "recommendations": recs,
                "success_probability": projected_prob,
                "schedule_stability": projected_prob,
                "capacity_impact": capacity_impact,
                "_system_confidence": sys_confidence
            }
            
        def _gemini_inference():
            local_result = _local_inference()
            sys_prompt = "You are the Digital Twin Agent. Your role is ONLY to explain forecasts and suggest improvements based on the local simulation data."
            user_prompt = f"""
LOCAL SIMULATION RESULT:
{json.dumps(local_result, indent=2)}

Enhance this result by keeping all scores, probabilities, and impacts EXACTLY the same. 
Only improve the 'recommendations' and 'cascade' descriptions to be more insightful and strategic.
"""
            return self.gemini.generate_structured(
                system_prompt=sys_prompt,
                user_prompt=user_prompt,
                schema=TWIN_SCHEMA,
                temperature=0.4
            )

        return execute_hybrid(_local_inference, _gemini_inference, threshold=85)

from typing import Dict, Any, Type, Callable

class AgentRegistry:
    """
    Decouples intent strings from their execution logic.
    Provides a standardized mapping to various backend agents and services.
    """
    
    _registry: Dict[str, Dict[str, Any]] = {}
    
    @classmethod
    def register(cls, target_agent: str, executor_func: Callable):
        cls._registry[target_agent] = {
            "execute": executor_func
        }
        
    @classmethod
    def get_executor(cls, target_agent: str) -> Callable:
        agent_data = cls._registry.get(target_agent)
        if agent_data:
            return agent_data.get("execute")
        return None

# --- Register Standard Agents ---
def navigate_executor(entities: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    target = entities.get("target_name", "").lower()
    valid_targets = ["dashboard", "settings", "goals", "planner", "calendar", "rescue", "analytics", "documents", "vision"]
    if target in valid_targets:
        return {"action": "navigate", "route": f"/{target}", "status": "Navigation requested", "message": f"Opening {target}."}
    return {"action": "navigate", "route": "/dashboard", "status": "Navigation requested", "message": "I'm not sure which page that is, opening your Dashboard."}

def focus_mode_executor(entities: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    return {"action": "navigate", "route": "/rescue", "status": "Focus Mode requested", "message": "Entering Focus Mode in the Rescue Center."}
    
def task_service_executor(entities: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    from models.task import Task
    from database.db import db
    from datetime import datetime, timezone, timedelta
    from services.orchestrator import OrchestratorService
    
    uid = context.get("user_id")
    task_title = entities.get("target_name", "New Task")
    target_date = entities.get("target_date")
    confidence = context.get("confidence", 90)

    try:
        deadline = datetime.fromisoformat(target_date) if target_date else datetime.now(timezone.utc) + timedelta(days=1)
    except:
        deadline = datetime.now(timezone.utc) + timedelta(days=1)

    existing_task = Task.query.filter_by(user_id=uid, title=task_title).first()
    if existing_task:
        OrchestratorService.add_event("Local Intelligence", "Prevented duplicate task creation", "warning", {"title": task_title})
        return {"action": "none", "status": "Task already exists", "message": f"You already have a task named {task_title}."}
    else:
        t = Task(user_id=uid, title=task_title, deadline=deadline, status="pending", source=context.get("source", "unknown"), ai_confidence=confidence)
        db.session.add(t)
        db.session.commit()
        OrchestratorService.add_event("Local Intelligence", "Created Task", "success", {"task_id": t.id})
        return {"action": "create_task", "status": "Task created", "message": f"I've added {task_title} to your tasks."}

def goal_service_executor(entities: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    from services.goal_service import GoalService
    from services.orchestrator import OrchestratorService
    uid = context.get("user_id")
    goal_title = entities.get("target_name", "New Goal")
    res = GoalService.create_goal(uid, goal_title, f"Created via {context.get('source', 'local intelligence')}.", "General", entities.get("target_date"))
    OrchestratorService.add_event("Local Intelligence", "Created Goal", "success", {"goal_id": res.get("goal", {}).get("id")})
    return {"action": "create_goal", "status": "Goal created", "message": f"Goal '{goal_title}' created."}

def rescue_agent_executor(entities: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    from agents.rescue_agent import RescueAgent
    from models.task import Task
    from services.orchestrator import OrchestratorService
    uid = context.get("user_id")
    tasks = [t.to_dict() for t in Task.query.filter_by(user_id=uid, status='pending').all()]
    execution_data = RescueAgent(context.get("gemini_service")).detect_risk(tasks, {"daily_available_hours": 4})
    OrchestratorService.add_event("Local Intelligence", "Triggered Rescue Mode", "warning", {"risk_detected": execution_data.get("risk_detected")})
    return {"action": "rescue_analysis", "status": "Analysis started", "message": "I've started a rescue analysis."}

def digital_twin_executor(entities: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    from agents.digital_twin_agent import DigitalTwinAgent
    from services.orchestrator import OrchestratorService
    from models.task import Task
    uid = context.get("user_id")
    tasks = [t.to_dict() for t in Task.query.filter_by(user_id=uid, status='pending').all()]
    DigitalTwinAgent(context.get("gemini_service")).simulate_scenario(tasks, {"action": "shift", "shift": "Local Intelligence Simulation"}, {"daily_available_hours": 8})
    OrchestratorService.add_event("Local Intelligence", "Triggered Digital Twin", "success", {"scenario": "Simulation"})
    return {"action": "simulate", "status": "Simulation complete", "message": "Digital Twin simulation complete."}

def planner_agent_executor(entities: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    from agents.planning_agent import PlanningAgent
    from models.task import Task
    from services.orchestrator import OrchestratorService
    uid = context.get("user_id")
    tasks = [t.to_dict() for t in Task.query.filter_by(user_id=uid, status='pending').all()]
    PlanningAgent(context.get("gemini_service")).generate_schedule(tasks, {"daily_available_hours": 8})
    OrchestratorService.add_event("Local Intelligence", "Generated Schedule", "success", {"tasks_planned": len(tasks)})
    return {"action": "generate_schedule", "status": "Schedule generated", "message": "I've planned your schedule."}

def general_query_executor(entities: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    from services.orchestrator import OrchestratorService
    OrchestratorService.add_event("Local Intelligence", "Processed Query", "success", {"intent": context.get("intent")})
    return {"action": "query", "status": "Query processed", "message": "Got it."}

AgentRegistry.register("Navigation", navigate_executor)
AgentRegistry.register("FocusMode", focus_mode_executor)
AgentRegistry.register("TaskService", task_service_executor)
AgentRegistry.register("GoalService", goal_service_executor)
AgentRegistry.register("RescueAgent", rescue_agent_executor)
AgentRegistry.register("DigitalTwinAgent", digital_twin_executor)
AgentRegistry.register("PlanningAgent", planner_agent_executor)
AgentRegistry.register("System", general_query_executor)

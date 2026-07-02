from app import create_app
from database.db import db
from models.task import Task
from services.orchestrator import OrchestratorService
import json

app = create_app()

def clear_tasks():
    Task.query.delete()
    db.session.commit()

def add_tasks(count):
    from datetime import datetime, timezone, timedelta
    for i in range(count):
        t = Task(title=f"Test Task {i}", status="pending", description="Test", deadline=datetime.now(timezone.utc) + timedelta(days=1))
        db.session.add(t)
    db.session.commit()

with app.app_context():
    from flask import g
    g.user_id = "test-user-id"
    orchestrator = OrchestratorService(app.extensions.get("gemini_service"))
    
    # Test 0 tasks
    clear_tasks()
    res0 = orchestrator.evaluate_system_state()
    print("=== 0 TASKS ===")
    print(res0["status"])
    print("Tasks Evaluated:", res0["tasks_evaluated"])
    
    # Test 1 task
    add_tasks(1)
    res1 = orchestrator.evaluate_system_state()
    print("=== 1 TASK ===")
    print(res1["status"])
    print("Tasks Evaluated:", res1["tasks_evaluated"])
    
    # Test 3 tasks
    clear_tasks()
    add_tasks(3)
    res3 = orchestrator.evaluate_system_state()
    print("=== MULTI TASKS ===")
    print(res3["status"])
    print("Tasks Evaluated:", res3["tasks_evaluated"])

    clear_tasks()

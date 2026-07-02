import time
import json
from app import create_app
from database.db import db
from models.task import Task
from services.orchestrator import OrchestratorService

app = create_app()

def clear_tasks():
    Task.query.delete()
    db.session.commit()

def add_tasks(count, with_deadlines=True, est=1.0):
    from datetime import datetime, timezone, timedelta
    for i in range(count):
        deadline = datetime.now(timezone.utc) + timedelta(days=1)
        t = Task(title=f"Test Task {i}", description="Normal task.", deadline=deadline, estimated_hours=est)
        db.session.add(t)
    db.session.commit()

with app.app_context():
    from flask import g
    g.user_id = "test-user-id"
    # 1. Mock Gemini to simulate "disabled" state completely
    class MockGeminiDisabled:
        def generate_structured(self, *args, **kwargs):
            raise Exception("Gemini is disabled in this test!")
            
    orchestrator = OrchestratorService(MockGeminiDisabled())
    
    clear_tasks()
    add_tasks(2, with_deadlines=True)
    
    print("--- RUNNING LOCAL INTELLIGENCE (Gemini Disabled) ---")
    start = time.time()
    res = orchestrator.evaluate_system_state(test_user_id)
    end = time.time()
    print("\n--- Final Briefing ---")
    
    print(f"Status: {res['status']}")
    print(f"Execution Time: {(end-start)*1000:.2f}ms")
    print(f"Tasks Evaluated: {res['tasks_evaluated']}")
    for t in res.get('trace', []):
        print(f"Agent: {t['agent']} -> {t['status']}")
    
    print("\n--- RUNNING HYBRID INTELLIGENCE (Gemini Fallback Test) ---")
    orchestrator_real = OrchestratorService(app.extensions.get("gemini_service"))
    clear_tasks()
    # Trigger Planning Agent overflow -> total est > 8 hours
    add_tasks(1, with_deadlines=True, est=12.0)
    
    start2 = time.time()
    res2 = orchestrator_real.evaluate_system_state()
    end2 = time.time()
    
    print(f"Status: {res2['status']}")
    print(f"Execution Time: {(end2-start2)*1000:.2f}ms")
    print(f"Tasks Evaluated: {res2['tasks_evaluated']}")
    for t in res2.get('trace', []):
        print(f"Agent: {t['agent']} -> {t['status']}")
        
    clear_tasks()

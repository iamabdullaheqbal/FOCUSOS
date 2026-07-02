import os
import sys
import time
import uuid
import requests
from datetime import datetime, timezone, timedelta

# Import Flask app for DB context
from app import create_app
from database.db import db
from models.task import Task
from models.goal import Goal, Milestone, Habit
from models.schedule import Schedule, ScheduleSlot
from models.notification import Notification
from models.intervention import RescuePlan, RescueExecution

BASE_URL = "http://localhost:5000/api"

app = create_app()

print("==================================================")
print(" DEADLINE OS - PRODUCTION END-TO-END QA SUITE")
print("==================================================")

report = {
    "modules": {},
    "performance": {},
    "bugs_discovered": [],
    "apis_tested": set()
}

def record_db_counts():
    counts = {}
    with app.app_context():
        counts["Task"] = Task.query.count()
        counts["Goal"] = Goal.query.count()
        counts["Habit"] = Habit.query.count()
        counts["Schedule"] = Schedule.query.count()
        counts["Notification"] = Notification.query.count()
        counts["RescuePlan"] = RescuePlan.query.count()
    return counts

def get_ephemeral_ids():
    ids = {}
    with app.app_context():
        ids["ScheduleSlot"] = {s.id for s in ScheduleSlot.query.all()}
        ids["Schedule"] = {s.id for s in Schedule.query.all()}
        ids["RescueExecution"] = {e.id for e in RescueExecution.query.all()}
        ids["RescuePlan"] = {p.id for p in RescuePlan.query.all()}
    return ids

initial_counts = record_db_counts()
initial_ephemeral_ids = get_ephemeral_ids()
print(f"INITIAL DB STATE: {initial_counts}")

qa_data_ids = {
    "tasks": [],
    "goals": [],
    "habits": [],
    "schedules": [],
    "notifications": []
}

def log_test(module, status, message=""):
    if module not in report["modules"]:
        report["modules"][module] = "PASS"
    if status == "FAIL":
        report["modules"][module] = "FAIL"
        report["bugs_discovered"].append(f"[{module}] {message}")
    print(f"[{module}] {'✅ PASS' if status == 'PASS' else '❌ FAIL'} {message}")

def test_api(method, endpoint, json=None, expected_status=200):
    t0 = time.time()
    report["apis_tested"].add(f"{method} {endpoint}")
    try:
        if method == "GET":
            res = requests.get(f"{BASE_URL}{endpoint}")
        elif method == "POST":
            res = requests.post(f"{BASE_URL}{endpoint}", json=json)
        elif method == "PUT":
            res = requests.put(f"{BASE_URL}{endpoint}", json=json)
        elif method == "DELETE":
            res = requests.delete(f"{BASE_URL}{endpoint}")
            
        t1 = time.time()
        elapsed = (t1 - t0) * 1000
        report["performance"][endpoint] = report["performance"].get(endpoint, []) + [elapsed]

        if res.status_code == 500:
            log_test("API_STABILITY", "FAIL", f"HTTP 500 on {method} {endpoint}: {res.text}")
            return None, res.status_code

        if expected_status and res.status_code != expected_status:
            log_test("API_ROUTING", "FAIL", f"Expected {expected_status}, got {res.status_code} on {method} {endpoint}")
            
        return res.json() if res.content else None, res.status_code
    except Exception as e:
        log_test("NETWORK", "FAIL", f"Network error on {method} {endpoint}: {str(e)}")
        return None, 0

# ---------------------------------------------------------
# 1. Negative Testing
# ---------------------------------------------------------
print("\n--- RUNNING NEGATIVE TESTS ---")
# Missing fields
res, status = test_api("POST", "/tasks", json={"description": "No title"}, expected_status=422)
if status == 422: log_test("Negative Testing", "PASS", "Task validation caught missing title")

# Invalid body
res, status = test_api("POST", "/tasks", json={}, expected_status=400)
if status == 400: log_test("Negative Testing", "PASS", "Task validation caught empty JSON")

# Invalid ID (404)
res, status = test_api("GET", "/tasks/invalid-123", expected_status=404)
if status == 404: log_test("Negative Testing", "PASS", "404 handler works for invalid task ID")


# ---------------------------------------------------------
# 2. Production User Journey
# ---------------------------------------------------------
print("\n--- RUNNING USER JOURNEYS ---")

# Journey 1: Create Goal -> Creates Tasks
future_date = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
goal_payload = {
    "title": "Launch DeadlineOS MVP",
    "description": "Production QA Validation Goal",
    "category": "Career",
    "target_date": future_date
}
res, status = test_api("POST", "/goals", json=goal_payload, expected_status=201)
if status == 201:
    goal_id = res.get("data", {}).get("id")
    qa_data_ids["goals"].append(goal_id)
    log_test("Goals", "PASS", "Goal created successfully")
    
    # (Milestones are currently managed via the Goal creation/editing inline payload, 
    # not a direct POST route, so we skip the independent POST test)
else:
    log_test("Goals", "FAIL", "Failed to create Goal")

# Create standalone Tasks
task_payload = {
    "title": "Review PostgreSQL schema",
    "deadline": future_date,
    "estimated_hours": 2.0,
    "category": "work"
}
res, status = test_api("POST", "/tasks", json=task_payload, expected_status=201)
if status == 201:
    task_id = res.get("task", {}).get("id")
    qa_data_ids["tasks"].append(task_id)
    log_test("Tasks", "PASS", "Task created")

# Create Habit
habit_payload = {
    "name": "Daily Planning",
    "category": "General",
    "frequency": "Daily"
}
res, status = test_api("POST", "/habits", json=habit_payload, expected_status=201)
if status == 201:
    habit_id = res.get("data", {}).get("id")
    qa_data_ids["habits"].append(habit_id)
    log_test("Habits", "PASS", "Habit created")
    
    # Check-in
    c_res, c_status = test_api("POST", f"/habits/{habit_id}/checkin", expected_status=200)
    if c_status == 200: log_test("Habits", "PASS", "Habit check-in successful")

# Run Planner
res, status = test_api("POST", "/agents/plan", json={"tasks": [{"id": qa_data_ids["tasks"][0], "title": "QA Task", "deadline": future_date}], "availability": {"daily_available_hours": 6}}, expected_status=200)
if status == 200:
    log_test("Planner", "PASS", "Schedule generated successfully")
else:
    log_test("Planner", "FAIL", "Failed to generate schedule")

# Run Analytics
res, status = test_api("GET", "/analytics/overview", expected_status=200)
if status == 200: log_test("Analytics", "PASS", "Analytics generated")

# Run Twin
res, status = test_api("POST", "/agents/digital-twin", json={"scenario": {"action": "delay", "task": "QA Task", "delay_days": 1}}, expected_status=200)
if status == 200: log_test("DigitalTwin", "PASS", "Twin simulation successful")

# Run Rescue
res, status = test_api("POST", "/agents/rescue", json={"tasks": [], "availability": {}}, expected_status=200)
if status == 200: log_test("RescueCenter", "PASS", "Rescue strategy generated")

# Test Notifications
res, status = test_api("GET", "/notifications", expected_status=200)
if status == 200: 
    log_test("Notifications", "PASS", "Notifications fetched")
    notifs = res.get("data", {}).get("notifications", [])
    for n in notifs:
        qa_data_ids["notifications"].append(n["id"])
        test_api("PUT", f"/notifications/{n['id']}/read", expected_status=200)


# ---------------------------------------------------------
# 3. Cleanup & Integrity
# ---------------------------------------------------------
print("\n--- EXECUTING TEARDOWN & CLEANUP ---")
for t_id in qa_data_ids["tasks"]:
    test_api("DELETE", f"/tasks/{t_id}", expected_status=200)
for g_id in qa_data_ids["goals"]:
    test_api("DELETE", f"/goals/{g_id}", expected_status=200)
for h_id in qa_data_ids["habits"]:
    test_api("DELETE", f"/habits/{h_id}", expected_status=200)
for n_id in qa_data_ids["notifications"]:
    test_api("DELETE", f"/notifications/{n_id}", expected_status=200)
# Safely clear only the ephemeral tables that were created during this test
with app.app_context():
    # Only delete notifications explicitly tracked
    for n_id in qa_data_ids["notifications"]:
        Notification.query.filter_by(id=n_id).delete()
    
    for item in ScheduleSlot.query.all():
        if item.id not in initial_ephemeral_ids["ScheduleSlot"]: db.session.delete(item)
    for item in Schedule.query.all():
        if item.id not in initial_ephemeral_ids["Schedule"]: db.session.delete(item)
    for item in RescueExecution.query.all():
        if item.id not in initial_ephemeral_ids["RescueExecution"]: db.session.delete(item)
    for item in RescuePlan.query.all():
        if item.id not in initial_ephemeral_ids["RescuePlan"]: db.session.delete(item)
        
    db.session.commit()

final_counts = record_db_counts()
print(f"FINAL DB STATE: {final_counts}")

integrity_pass = True
for key in initial_counts:
    if initial_counts[key] != final_counts[key]:
        integrity_pass = False
        log_test("Data Integrity", "FAIL", f"{key} count mismatch: initial={initial_counts[key]}, final={final_counts[key]}")
if integrity_pass:
    log_test("Data Integrity", "PASS", "All tables reverted to initial row counts (no orphaned records)")

# ---------------------------------------------------------
# 4. Generate Report
# ---------------------------------------------------------
print("\n==================================================")
print(" PRODUCTION QA REPORT")
print("==================================================")
for mod, stat in report["modules"].items():
    print(f"{mod}: {stat}")
    
print("\nPERFORMANCE METRICS (avg response time ms):")
for ep, times in report["performance"].items():
    avg = sum(times) / len(times)
    print(f"{ep}: {avg:.1f}ms")

if report["bugs_discovered"]:
    print("\nBUGS DISCOVERED:")
    for b in report["bugs_discovered"]:
        print(f"- {b}")
else:
    print("\nNO BUGS DISCOVERED. SYSTEM IS STABLE.")

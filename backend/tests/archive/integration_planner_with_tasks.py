import requests
import os
import time
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
email = os.environ.get("DEMO_USER_EMAIL")
password = os.environ.get("DEMO_USER_PASSWORD")

# Login
res = requests.post(
    f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
    json={"email": email, "password": password},
    headers={"apikey": ANON_KEY, "Content-Type": "application/json"}
)
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Create a task
task_res = requests.post("http://localhost:5000/api/tasks", headers=headers, json={
    "title": "Build production AI",
    "estimated_hours": 3,
    "deadline": "2026-12-31T00:00:00Z",
    "priority": 1
})
print("Task creation:", task_res.status_code)

tasks = requests.get("http://localhost:5000/api/tasks", headers=headers).json().get("tasks", [])

print("Triggering planner with tasks...")
plan_res = requests.post("http://localhost:5000/api/agents/plan", headers=headers, json={"tasks": tasks})
print(plan_res.status_code)
print(plan_res.text)


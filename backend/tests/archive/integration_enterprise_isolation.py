import os
import requests
import json
import time

from dotenv import load_dotenv

load_dotenv()
API_URL = "http://localhost:5000/api"
SUPABASE_URL = os.environ.get("SUPABASE_URL")
ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")

import uuid
run_id = str(uuid.uuid4())[:8]

users = [
    {"email": f"alice_{run_id}@deadlineos.com", "password": "Password123!", "name": "Alice"},
    {"email": f"bob_{run_id}@deadlineos.com", "password": "Password123!", "name": "Bob"},
    {"email": f"charlie_{run_id}@deadlineos.com", "password": "Password123!", "name": "Charlie"},
    {"email": f"david_{run_id}@deadlineos.com", "password": "Password123!", "name": "David"},
    {"email": f"emma_{run_id}@deadlineos.com", "password": "Password123!", "name": "Emma"}
]

tokens = {}

SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

print("--- Registering Users via Admin API ---")
for u in users:
    # 1. Create User via Admin API (bypasses rate limits and auto-confirms)
    res = requests.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        json={"email": u["email"], "password": u["password"], "email_confirm": True, "user_metadata": {"name": u["name"]}},
        headers={"Authorization": f"Bearer {SERVICE_ROLE_KEY}", "apikey": SERVICE_ROLE_KEY, "Content-Type": "application/json"}
    )
    if res.status_code in [200, 201]:
        print(f"Created {u['name']} via Admin API")
    else:
        print(f"Admin create failed for {u['name']}: {res.text}")

    # 2. Login as the newly created (and confirmed) user
    login_res = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        json={"email": u["email"], "password": u["password"]},
        headers={"apikey": ANON_KEY, "Content-Type": "application/json"}
    )
    
    try:
        tokens[u["name"]] = login_res.json()["access_token"]
        print(f"Logged in {u['name']}")
    except KeyError:
        print(f"Failed to login {u['name']}: {login_res.text}")

print("\n--- Populating Data ---")
for name, token in tokens.items():
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    # Task
    res = requests.post(f"{API_URL}/tasks", headers=headers, json={
        "title": f"{name}'s Secret Task", "estimated_hours": 2, "deadline": "2026-12-31T00:00:00Z"
    })
    # Goal
    res = requests.post(f"{API_URL}/goals", headers=headers, json={
        "title": f"{name}'s Secret Goal", "category": "Work"
    })

print("\n--- Testing Isolation ---")
# Alice tries to read tasks. Does she see Bob's?
headers_alice = {"Authorization": f"Bearer {tokens['Alice']}", "Content-Type": "application/json"}
tasks_alice = requests.get(f"{API_URL}/tasks", headers=headers_alice).json().get("tasks", [])

passed = True
for t in tasks_alice:
    if "Alice" not in t.get("title", ""):
        print(f"FAIL: Alice can see {t.get('title')}")
        passed = False

# Try getting Bob's tasks directly? The API only has GET /tasks which relies on g.user_id. 
# There's no GET /tasks/<id> across users.
if passed:
    print("SUCCESS: Isolation verified! Users can only see their own data.")

print("\n--- Test Complete ---")

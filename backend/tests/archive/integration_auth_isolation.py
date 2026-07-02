import os
import requests
import json
import uuid
import time
from dotenv import load_dotenv

load_dotenv()
API_URL = "http://localhost:5000/api"
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")

run_id = str(uuid.uuid4())[:8]

users = [
    {"email": f"alice_{run_id}@deadlineos.com", "password": "Password123!", "name": "Alice"},
    {"email": f"bob_{run_id}@deadlineos.com", "password": "Password123!", "name": "Bob"},
    {"email": f"charlie_{run_id}@deadlineos.com", "password": "Password123!", "name": "Charlie"},
    {"email": f"david_{run_id}@deadlineos.com", "password": "Password123!", "name": "David"},
    {"email": f"emma_{run_id}@deadlineos.com", "password": "Password123!", "name": "Emma"}
]

tokens = {}
user_ids = {}

print("=== Phase 1: Authentication & Multi-Tenant Creation ===")
headers_admin = {"Authorization": f"Bearer {SERVICE_ROLE_KEY}", "apikey": SERVICE_ROLE_KEY, "Content-Type": "application/json"}

for u in users:
    # Create via Admin
    res = requests.post(f"{SUPABASE_URL}/auth/v1/admin/users", json={"email": u["email"], "password": u["password"], "email_confirm": True, "user_metadata": {"name": u["name"]}}, headers=headers_admin)
    if res.status_code in [200, 201]:
        user_ids[u["name"]] = res.json()["id"]
        print(f"Created {u['name']} (ID: {user_ids[u['name']]})")
    else:
        print(f"Admin create failed for {u['name']}: {res.text}")

    # Login to get JWT
    login_res = requests.post(f"{SUPABASE_URL}/auth/v1/token?grant_type=password", json={"email": u["email"], "password": u["password"]}, headers={"apikey": ANON_KEY, "Content-Type": "application/json"})
    if login_res.status_code == 200:
        tokens[u["name"]] = login_res.json()["access_token"]
        print(f"Authenticated {u['name']}")
    else:
        print(f"Failed to authenticate {u['name']}")

print("\n=== Phase 2: Data Hydration ===")
# Populate data
for name, token in tokens.items():
    h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Task
    t_res = requests.post(f"{API_URL}/tasks", headers=h, json={"title": f"{name}'s Secret Task", "estimated_hours": 2, "deadline": "2026-12-31T00:00:00Z", "priority": "High"})
    # Goal
    requests.post(f"{API_URL}/goals", headers=h, json={"title": f"{name}'s Secret Goal", "category": "Work", "deadline": "2026-12-31T00:00:00Z", "priority": "High"})
    # Planner
    if t_res.status_code == 201:
        requests.post(f"{API_URL}/planner/generate", headers=h, json={"hours": 4})
        
    print(f"Hydrated data for {name}")

print("\n=== Phase 3: Data Isolation Matrix (Cross-Tenant Validation) ===")
# Test Isolation
passed = True

alice_h = {"Authorization": f"Bearer {tokens['Alice']}", "Content-Type": "application/json"}

# 3.1: Alice fetches Tasks. Verify only Alice's tasks are returned.
alice_tasks = requests.get(f"{API_URL}/tasks", headers=alice_h).json().get("tasks", [])
for t in alice_tasks:
    if "Alice" not in t.get("title", ""):
        print(f"[FAIL] Alice can see {t.get('title')}")
        passed = False

if passed:
    print("[PASS] GET Isolation Verified: Users only see their own data.")

# 3.2: Tampered Token
bad_token = tokens["Alice"][:-5] + "XXXXX"
res_bad = requests.get(f"{API_URL}/tasks", headers={"Authorization": f"Bearer {bad_token}"})
if res_bad.status_code in [401, 403]:
    print("[PASS] JWT Tampering Protection Verified")
else:
    print("[FAIL] System accepted tampered token")
    passed = False

# 3.3 Missing Token
res_miss = requests.get(f"{API_URL}/tasks")
if res_miss.status_code == 401:
    print("[PASS] Missing Token Protection Verified")
else:
    print("[FAIL] System allowed unauthenticated request")
    passed = False

print("\n=== Phase 4: Teardown & Cleanup ===")
for name, uid in user_ids.items():
    del_res = requests.delete(f"{SUPABASE_URL}/auth/v1/admin/users/{uid}", headers=headers_admin)
    if del_res.status_code == 200:
        print(f"Purged {name}")
    else:
        print(f"Failed to purge {name}")

if passed:
    print("\n[PASS] MULTI-TENANT ISOLATION SUITE: 100% PASS")
else:
    print("\n[FAIL] MULTI-TENANT ISOLATION SUITE: FAILED")

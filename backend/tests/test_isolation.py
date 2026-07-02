import os
import requests
import time
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
API_URL = "http://localhost:5000/api"

users = [
    {"email": "alice@deadlineos.com", "password": "password123", "name": "Alice"},
    {"email": "bob@deadlineos.com", "password": "password123", "name": "Bob"},
    {"email": "charlie@deadlineos.com", "password": "password123", "name": "Charlie"}
]

created_users = []
user_tokens = {}

def create_user(email, password, name):
    print(f"Creating user {name} via Admin API...")
    res = requests.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        json={"email": email, "password": password, "email_confirm": True, "user_metadata": {"name": name}},
        headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}", "Content-Type": "application/json"}
    )
    if res.ok:
        user_id = res.json()["id"]
        created_users.append(user_id)
        return user_id
    else:
        # User might already exist
        print(f"User {name} might already exist or error: {res.text}")
        return None

def login_user(email, password):
    res = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        json={"email": email, "password": password},
        headers={"apikey": ANON_KEY, "Content-Type": "application/json"}
    )
    if res.ok:
        return res.json()["access_token"]
    print(f"Failed to login {email}: {res.text}")
    return None

def delete_user(user_id):
    print(f"Deleting user {user_id}...")
    requests.delete(
        f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
        headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"}
    )

print("\n--- PHASE 1: CREATE USERS ---")
for u in users:
    create_user(u["email"], u["password"], u["name"])

print("\n--- PHASE 2: LOGIN ---")
for u in users:
    token = login_user(u["email"], u["password"])
    if token:
        user_tokens[u["name"]] = token

print("\n--- PHASE 3: POPULATE DATA ---")
for name, token in user_tokens.items():
    print(f"Creating task for {name}...")
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    res = requests.post(f"{API_URL}/tasks", json={
        "title": f"Secret task for {name}",
        "description": "Top secret",
        "priority": 1,
        "deadline": "2026-12-31T00:00:00Z"
    }, headers=headers)
    if not res.ok:
        print(f"Failed to create task for {name}:", res.text)

print("\n--- PHASE 4: VERIFY ISOLATION ---")
isolation_passed = True
for name, token in user_tokens.items():
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    res = requests.get(f"{API_URL}/tasks", headers=headers)
    if res.ok:
        tasks = res.json().get("tasks", [])
        for t in tasks:
            if name not in t["title"]:
                print(f"FAIL: {name} can see a task belonging to someone else! Task: {t['title']}")
                isolation_passed = False
    else:
        print(f"FAIL: {name} could not fetch tasks. {res.text}")
        isolation_passed = False

print("\n--- PHASE 5: CLEANUP ---")
for uid in created_users:
    delete_user(uid)

print("\n===============================")
if isolation_passed:
    print("MULTI-USER ISOLATION: PASS")
else:
    print("MULTI-USER ISOLATION: FAIL")
print("===============================\n")

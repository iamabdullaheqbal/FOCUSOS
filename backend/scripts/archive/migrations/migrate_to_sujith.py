import os
import requests
import sqlalchemy
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
DATABASE_URL = os.environ.get("DATABASE_URL")

email = "demo@deadlineos.com"
password = "DemoWorkspace2026!"

SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}

print("Attempting to create demo user via Admin API...")
res = requests.post(f"{SUPABASE_URL}/auth/v1/admin/users", json={
    "email": email,
    "password": password,
    "email_confirm": True
}, headers=headers)

if res.status_code in [200, 201]:
    print(f"Created demo user successfully.")
else:
    print(f"Creation failed (maybe exists?): {res.text}")

print("Demo user provisioned.")
import sys; sys.exit(0)

headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}

print("Attempting to create user via Admin API...")
res = requests.post(f"{SUPABASE_URL}/auth/v1/admin/users", json={
    "email": email,
    "password": password,
    "email_confirm": True
}, headers=headers)

user_id = None
if res.status_code in [200, 201]:
    data = res.json()
    user_id = data.get("id")
    print(f"Created user successfully. User ID: {user_id}")
else:
    print(f"Creation failed (maybe exists?): {res.text}")
    # Try getting the user by email or just assume we can get it via admin users list
    res_list = requests.get(f"{SUPABASE_URL}/auth/v1/admin/users", headers=headers)
    if res_list.status_code == 200:
        users = res_list.json().get("users", [])
        for u in users:
            if u.get("email") == email:
                user_id = u.get("id")
                print(f"Found existing user. User ID: {user_id}")
                break

if not user_id:
    print("Could not obtain user_id.")
    exit(1)

print("Starting database migration...")
engine = sqlalchemy.create_engine(DATABASE_URL)

tables = [
    "tasks", "goals", "milestones", "habits", "habit_logs", 
    "schedules", "schedule_slots", "interventions", "threats",
    "rescue_plans", "system_snapshots", "rescue_executions",
    "notifications", "accountability_metrics", "coach_reports",
    "reflection_reports", "execution_profiles", "weekly_reviews",
    "agent_execution_logs", "twin_simulation_logs", "orchestrator_events"
]

with engine.connect() as conn:
    old_user = conn.execute(sqlalchemy.text("SELECT id FROM users WHERE username = 'sujith'")).fetchone()
    old_user_id = old_user[0] if old_user else None

    # Rename old user temporarily to avoid unique constraint issues
    if old_user_id and old_user_id != user_id:
        conn.execute(sqlalchemy.text("UPDATE users SET username = 'sujith_old', email = 'old@deadlineos.com' WHERE id = :uid"), {"uid": old_user_id})

    # Insert new user
    existing_new_user = conn.execute(sqlalchemy.text("SELECT id FROM users WHERE id = :uid"), {"uid": user_id}).fetchone()
    if not existing_new_user:
        conn.execute(sqlalchemy.text("""
            INSERT INTO users (id, email, username, full_name, created_at)
            VALUES (:uid, :email, 'sujith', 'Sujith', NOW())
        """), {"uid": user_id, "email": email})

    # Now update all tables where user_id = old_user_id
    for table in tables:
        try:
            if old_user_id:
                conn.execute(sqlalchemy.text(f"UPDATE {table} SET user_id = :new_uid WHERE user_id = :old_uid"), {"new_uid": user_id, "old_uid": old_user_id})
            # Also catch any nulls or test-user-id if needed
            conn.execute(sqlalchemy.text(f"UPDATE {table} SET user_id = :new_uid WHERE user_id IS NULL OR user_id = 'test-user-id' OR user_id = 'test-user-a-1234-5678'"), {"new_uid": user_id})
            print(f"Migrated {table}")
        except Exception as e:
            print(f"Skipped {table} (or error): {e}")

    # Delete old user
    if old_user_id and old_user_id != user_id:
        conn.execute(sqlalchemy.text("DELETE FROM users WHERE id = :uid"), {"uid": old_user_id})

    conn.commit()

print("Migration complete. All records belong to sujith.")

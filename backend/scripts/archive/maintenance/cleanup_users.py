import os
import requests
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

headers = {"Authorization": f"Bearer {SERVICE_ROLE_KEY}", "apikey": SERVICE_ROLE_KEY, "Content-Type": "application/json"}

print("--- Fetching Users ---")
res = requests.get(f"{SUPABASE_URL}/auth/v1/admin/users", headers=headers)
if res.status_code == 200:
    users = res.json().get("users", [])
    for u in users:
        email = u.get("email", "")
        if "deadlineos.com" in email and "demo" not in email:
            print(f"Deleting user {email} ({u['id']})")
            del_res = requests.delete(f"{SUPABASE_URL}/auth/v1/admin/users/{u['id']}", headers=headers)
            print(del_res.status_code)
else:
    print("Failed to fetch users:", res.text)

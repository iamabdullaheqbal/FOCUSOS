import os
import requests
from dotenv import load_dotenv

load_dotenv()

email = os.environ.get("DEMO_USER_EMAIL")
password = os.environ.get("DEMO_USER_PASSWORD")
supabase_url = os.environ.get("SUPABASE_URL")
anon_key = os.environ.get("SUPABASE_ANON_KEY")

print(f"Logging in as {email}...")

res = requests.post(
    f"{supabase_url}/auth/v1/token?grant_type=password",
    json={"email": email, "password": password},
    headers={"apikey": anon_key, "Content-Type": "application/json"}
)

if not res.ok:
    print("Login failed:", res.text)
    exit(1)

data = res.json()
token = data["access_token"]
print("Login successful! Token length:", len(token))

# Hit backend
api_url = "http://localhost:5000/api/tasks"
res2 = requests.get(api_url, headers={"Authorization": f"Bearer {token}"})

print("Tasks API Response:", res2.status_code)
print(res2.text)

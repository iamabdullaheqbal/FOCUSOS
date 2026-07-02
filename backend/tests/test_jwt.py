import os
import requests
import jwt
from dotenv import load_dotenv

load_dotenv()

email = os.environ.get("DEMO_USER_EMAIL")
password = os.environ.get("DEMO_USER_PASSWORD")
supabase_url = os.environ.get("SUPABASE_URL")
anon_key = os.environ.get("SUPABASE_ANON_KEY")

res = requests.post(
    f"{supabase_url}/auth/v1/token?grant_type=password",
    json={"email": email, "password": password},
    headers={"apikey": anon_key, "Content-Type": "application/json"}
)

token = res.json()["access_token"]
print("Header:")
header = jwt.get_unverified_header(token)
print(header)

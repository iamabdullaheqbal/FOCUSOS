import os
import requests
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.environ.get("SUPABASE_URL")
anon_key = os.environ.get("SUPABASE_ANON_KEY")

url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
print(f"Fetching JWKS from: {url}")
res = requests.get(url)
print("Status:", res.status_code)
print("Response:", res.text)

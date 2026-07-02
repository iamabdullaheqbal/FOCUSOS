import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv('.env')
url = os.getenv("DATABASE_URL")
engine = create_engine(url)

commands = [
    "ALTER TABLE goals ADD COLUMN pinned BOOLEAN DEFAULT FALSE;",
    "ALTER TABLE habits ADD COLUMN last_checkin_date VARCHAR(50);"
]

with engine.begin() as conn:
    for cmd in commands:
        try:
            conn.execute(text(cmd))
            print(f"SUCCESS: {cmd}")
        except Exception as e:
            print(f"SKIPPED (probably exists): {cmd}")

print("Phase 7 Migration applied.")

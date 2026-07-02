import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

from app import create_app
from database.db import db
import models.intervention

# Create new tables (Threat, SystemSnapshot)
app = create_app()
with app.app_context():
    db.create_all()
    print("New tables ensured via create_all().")

# Alter existing tables
load_dotenv('.env')
url = os.getenv("DATABASE_URL")
if not url:
    print("No DATABASE_URL found.")
    sys.exit(1)

engine = create_engine(url)

commands = [
    "ALTER TABLE rescue_executions ALTER COLUMN plan_id DROP NOT NULL;",
    "ALTER TABLE rescue_executions ALTER COLUMN user_response DROP NOT NULL;",
    "ALTER TABLE rescue_executions ADD COLUMN snapshot_id VARCHAR(36);",
    "ALTER TABLE rescue_executions ADD COLUMN strategy_name VARCHAR(50);",
    "ALTER TABLE rescue_executions ADD COLUMN executed_actions JSON;",
    "ALTER TABLE rescue_executions ADD COLUMN status VARCHAR(20) DEFAULT 'executed';"
]

with engine.begin() as conn:
    for cmd in commands:
        try:
            conn.execute(text(cmd))
            print(f"SUCCESS: {cmd}")
        except Exception as e:
            print(f"SKIPPED/ERROR: {cmd} - {e}")

print("Phase 9 Migration applied.")

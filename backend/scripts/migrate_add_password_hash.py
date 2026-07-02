"""
Migration: add password_hash column to users table.
Run once: python scripts/migrate_add_password_hash.py
"""
import os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from database.db import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    with db.engine.connect() as conn:
        try:
            conn.execute(text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(256);"
            ))
            conn.commit()
            print("✅  password_hash column added (or already existed).")
        except Exception as e:
            print(f"⚠️  {e}")

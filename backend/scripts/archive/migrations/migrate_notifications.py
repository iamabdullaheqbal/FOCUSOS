import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from database.db import db
import models.notification

app = create_app()
with app.app_context():
    db.create_all()
    print("Notification table ensured via create_all().")

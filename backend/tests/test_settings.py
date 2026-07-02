import pytest
import json
from models.user_settings import UserSettings
from models.user_session import UserSession
from database.db import db

def test_get_profile(client, mock_auth_headers):
    res = client.get('/api/settings/profile', headers=mock_auth_headers)
    assert res.status_code == 200
    assert "email" in res.json["data"]

def test_update_profile(client, mock_auth_headers):
    res = client.put('/api/settings/profile', headers=mock_auth_headers, json={"full_name": "Test Update"})
    assert res.status_code == 200
    assert res.json["data"]["full_name"] == "Test Update"

def test_get_settings_section(client, mock_auth_headers):
    res = client.get('/api/settings/appearance', headers=mock_auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json["data"], dict)

def test_update_settings_section(client, mock_auth_headers):
    res = client.put('/api/settings/appearance', headers=mock_auth_headers, json={"theme": "dark"})
    assert res.status_code == 200
    assert res.json["data"]["theme"] == "dark"
    
    # Verify persistence
    res = client.get('/api/settings/appearance', headers=mock_auth_headers)
    assert res.json["data"]["theme"] == "dark"

def test_invalid_settings_section(client, mock_auth_headers):
    res = client.get('/api/settings/invalid_section', headers=mock_auth_headers)
    assert res.status_code == 400

def test_get_sessions(client, mock_auth_headers, app):
    # Create mock session
    with app.app_context():
        session = UserSession(user_id="test_user_id", browser="Chrome", os="Mac")
        db.session.add(session)
        db.session.commit()
        
    res = client.get('/api/settings/sessions', headers=mock_auth_headers)
    assert res.status_code == 200
    assert len(res.json["data"]) > 0
    assert res.json["data"][0]["browser"] == "Chrome"

def test_data_export(client, mock_auth_headers):
    res = client.post('/api/settings/export', headers=mock_auth_headers)
    assert res.status_code == 200
    assert "profile" in res.json["data"]
    assert "settings" in res.json["data"]
    assert "tasks" in res.json["data"]
    assert "goals" in res.json["data"]

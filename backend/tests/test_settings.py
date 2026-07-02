"""
FocusOS — Settings API Tests
==============================
Uses pytest-asyncio + httpx AsyncClient against the FastAPI app.
"""

import pytest
from httpx import AsyncClient
from main import app


@pytest.mark.asyncio
async def test_get_profile(auth_headers):
    async with AsyncClient(app=app, base_url="http://test") as client:
        res = await client.get("/api/settings/profile", headers=auth_headers)
    assert res.status_code == 200
    assert "email" in res.json()["data"]


@pytest.mark.asyncio
async def test_update_profile(auth_headers):
    async with AsyncClient(app=app, base_url="http://test") as client:
        res = await client.put("/api/settings/profile", headers=auth_headers,
                               json={"full_name": "Test Update"})
    assert res.status_code == 200
    assert res.json()["data"]["full_name"] == "Test Update"


@pytest.mark.asyncio
async def test_get_settings_section(auth_headers):
    async with AsyncClient(app=app, base_url="http://test") as client:
        res = await client.get("/api/settings/appearance", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json()["data"], dict)


@pytest.mark.asyncio
async def test_update_settings_section(auth_headers):
    async with AsyncClient(app=app, base_url="http://test") as client:
        res = await client.put("/api/settings/appearance", headers=auth_headers,
                               json={"theme": "dark"})
    assert res.status_code == 200
    assert res.json()["data"]["theme"] == "dark"

    async with AsyncClient(app=app, base_url="http://test") as client:
        res = await client.get("/api/settings/appearance", headers=auth_headers)
    assert res.json()["data"]["theme"] == "dark"


@pytest.mark.asyncio
async def test_invalid_settings_section(auth_headers):
    async with AsyncClient(app=app, base_url="http://test") as client:
        res = await client.get("/api/settings/invalid_section", headers=auth_headers)
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_data_export(auth_headers):
    async with AsyncClient(app=app, base_url="http://test") as client:
        res = await client.post("/api/settings/export", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "profile" in data
    assert "tasks" in data
    assert "goals" in data

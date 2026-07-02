import asyncio
import aiohttp
import time
import os
from dotenv import load_dotenv

load_dotenv()
API_URL = "http://localhost:5000/api"
DEMO_EMAIL = os.environ.get("DEMO_USER_EMAIL")
DEMO_PASS = os.environ.get("DEMO_USER_PASSWORD")

async def get_token(session):
    async with session.post(f"{API_URL}/demo/start", json={"email": DEMO_EMAIL, "password": DEMO_PASS}) as res:
        data = await res.json()
        return data.get("token")

async def stress_user(session, token, user_id):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # 1. Fetch Dashboard
    t0 = time.time()
    async with session.get(f"{API_URL}/dashboard", headers=headers) as r:
        await r.json()
    t1 = time.time()
    
    # 2. Create Task
    t2 = time.time()
    async with session.post(f"{API_URL}/tasks", headers=headers, json={"title": f"Stress Task {user_id}", "estimated_hours": 1, "deadline": "2026-12-31T00:00:00Z"}) as r:
        await r.json()
    t3 = time.time()
    
    return [t1-t0, t3-t2]

async def run_stress(users):
    print(f"\n--- Running Stress Test: {users} Concurrent Users ---")
    async with aiohttp.ClientSession() as session:
        token = await get_token(session)
        tasks = []
        for i in range(users):
            tasks.append(stress_user(session, token, i))
            
        start = time.time()
        results = await asyncio.gather(*tasks)
        end = time.time()
        
        flat_results = [item for sublist in results for item in sublist]
        avg = sum(flat_results) / len(flat_results)
        print(f"Total Time: {end-start:.2f}s")
        print(f"Average Request Latency: {avg*1000:.2f}ms")
        print(f"Throughput: {len(flat_results)/(end-start):.2f} req/s")

def main():
    print("=== Phase 11: Performance Stress Testing ===")
    asyncio.run(run_stress(10))
    asyncio.run(run_stress(25))
    asyncio.run(run_stress(50))
    asyncio.run(run_stress(100))

if __name__ == "__main__":
    main()

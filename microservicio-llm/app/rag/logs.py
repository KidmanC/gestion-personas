import json
from datetime import datetime
import httpx

async def register_log(action: str, details: dict = None):

    if details is None:
        details = {}

    log_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "action": action,
        "service": "llm-microservice",
        "details": details
    }

    try:
        async with httpx.AsyncClient() as client:
            await client.post("http://logs-service:3005/logs", json=log_data)
        print("Log sent to logging service successfully")

    except Exception as e:
        print(f"Failed to send log to logging service: {str(e)}")
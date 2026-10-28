import os
from dotenv import load_dotenv
import logging
import jwt
from fastapi import HTTPException, status
from langchain_core.tools import tool
from datetime import datetime, timedelta, timezone


load_dotenv(override=True)

expiry_time = datetime.now(timezone.utc) + timedelta(days=1)
SECRET_KEY = os.environ.get("JWT_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 1 # validity period of jwt


# @tool(description="Generate agent access token")
async def generate_agent_access_token():
  payload = {
    "sub": "PennyAi",
    "role": "agent"
  }
  token = jwt.encode(payload=payload, key=SECRET_KEY, algorithm=ALGORITHM)
  return token


async def decode_agent_access_token(token: str):
  try:
    payload = jwt.decode(token, key=SECRET_KEY, algorithms=ALGORITHM)
    return payload
  except Exception as e:
    logging.error(f"Error decoding agent access token: {e}")
    return None
    return user
  except Exception as e:
    logging.error(f"Error decoding agent access token: {e}")
    return None

import os
from dotenv import load_dotenv
import jwt
from jwt.exceptions import InvalidTokenError
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status

load_dotenv(override=True)

expiry_time = datetime.now(timezone.utc) + timedelta(days=1)
SECRET_KEY = os.environ.get("JWT_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 1 # validity period of jwt


async def create_access_token(payload: dict):
  payload["exp"] = expiry_time
  token = jwt.encode(payload=payload, key=SECRET_KEY, algorithm=ALGORITHM)

  return token


async def decode_token(token: str):
  try:
    payload = jwt.decode(token, key=SECRET_KEY, algorithms=ALGORITHM)
    return payload
  except InvalidTokenError as e:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid token",
    )
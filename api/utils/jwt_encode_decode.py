import os
from dotenv import load_dotenv
import jwt
from jwt.exceptions import InvalidTokenError
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from modules.users.user_service import get_user_by_email
from database_config import get_db
from sqlalchemy.orm import Session
from fastapi import Depends

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


async def get_current_user(token: str, db: Session = Depends(get_db)):
  try:
    user_info = await decode_token(token)
    user = await get_user_by_email(email=user_info["email"], db=db)
    if not user:
      raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token",
      )
    return user
  except InvalidTokenError as e:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid token",
    )
  
import logging
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from database_config import get_db
from modules.users import user_service
from modules.users.enums.gender import Gender


async def register_user(
  first_name: str,
  last_name: str,
  email: str,
  password: str,
  gender: Gender,
  db: Session = Depends(get_db),
):
  try:
    cipher = CryptContext(schemes="sha256_crypt")
    hashed_password = cipher.hash(password)
    return await user_service.create_user(
      first_name=first_name,
      last_name=last_name,
      email=email,
      password=hashed_password,
      gender=gender,
      db=db,
    )
  except HTTPException as e:
    logging.error(f"Error in user registration: {e}")
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail="Failed to register user",
    )


import logging
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from database_config import get_db
from modules.users import user_service
from modules.users.enums.gender import Gender
from utils import jwt_encode_decode


async def register_customer(
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


async def authenticate_user(email: str, password: str, db: Session = Depends(get_db)):
  try:
    user = await user_service.get_user_by_email(email=email, db=db)
    cipher = CryptContext(schemes="sha256_crypt")
    if not user or not cipher.verify(password, user.password):
      raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
      )
    payload = {
      "sub": str(user.id),
      "email": str(user.email),
      "role": str(user.role)
    }
    token = await jwt_encode_decode.create_access_token(payload)
    return{
      "access_token": token,
      "token_type": "bearer",
      "user": user
    }
  except HTTPException as e:
    logging.error(f"Error in user authentication: {e}")
    if e.status_code == status.HTTP_401_UNAUTHORIZED:
      raise e
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail="Failed to authenticate user",
    )
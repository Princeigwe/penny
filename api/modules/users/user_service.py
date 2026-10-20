from fastapi import Depends, HTTPException, status
from database_config import get_db
from sqlalchemy.orm import Session
from sqlalchemy.exc import DatabaseError
from .models.user_model import User
from .enums.gender import Gender



async def create_user(
  first_name: str,
  last_name: str,
  email: str,
  password: str,
  gender: Gender,
  db: Session = Depends(get_db)
):
  try:
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
      raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")
    
    new_user = User(
      email=email,
      password=password,
      first_name=first_name,
      last_name=last_name,
      gender=gender
    )
    db.add(new_user)
    db.commit()
    return new_user
  except Exception as e:
    print(e)
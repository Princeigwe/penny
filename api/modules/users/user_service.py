import logging
from agentic_workflows.ai_layer import ai
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from database_config import get_db

from .enums.gender import Gender
from .enums.role import Role
from .models.user_model import User


async def create_user(
  first_name: str,
  last_name: str,
  email: str,
  password: str,
  gender: Gender,
  db: Session = Depends(get_db),
):
  try:
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
      raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists"
      )

    new_user = User(
      email=email,
      password=password,
      first_name=first_name,
      last_name=last_name,
      gender=gender,
      role=Role.CUSTOMER
    )
    db.add(new_user)
    db.commit()
    return new_user
  except HTTPException as e:
    raise HTTPException(
      detail="Error creating user",
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


async def get_user_by_email(email: str, db: Session = Depends(get_db)):
	try:
		user = db.query(User).filter(User.email == email).first()
		if not user:
			raise HTTPException(
				status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
			)
		return user
	except HTTPException as e:
		logging.error(f"Error in user lookup by email: {e}")
		if e.status_code == status.HTTP_404_NOT_FOUND:
			raise e
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail="Failed to get user by email",
		)


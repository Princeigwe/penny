from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database_config import get_db

from . import user_service
from .dtos.create_user_dto import Create_User_Dto

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/")
async def create_user(body: Create_User_Dto, db: Session = Depends(get_db)):
  return await user_service.create_user(
    first_name=body.first_name,
    last_name=body.last_name,
    email=body.email,
    password=body.password,
    gender=body.phone,
    db=db,
  )


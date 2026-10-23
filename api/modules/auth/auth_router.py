from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from . import auth_service
from database_config import get_db
from fastapi.security import OAuth2PasswordRequestForm
from modules.users.dtos.create_user_dto import CreateUserDto

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
async def register_user(body: CreateUserDto, db: Session = Depends(get_db)):
  return await auth_service.register_user(
    first_name=body.first_name,
    last_name=body.last_name,
    email=body.email,
    password=body.password,
    gender=body.gender,
    db=db
  )
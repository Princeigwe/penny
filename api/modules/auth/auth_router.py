from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from . import auth_service
from database_config import get_db
from fastapi.security import OAuth2PasswordRequestForm
from modules.users.dtos.create_user_dto import Create_User_Dto
from .dtos.access_token_response_dto import TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
async def register_customer(body: Create_User_Dto, db: Session = Depends(get_db)):
  return await auth_service.register_customer(
    first_name=body.first_name,
    last_name=body.last_name,
    email=body.email,
    password=body.password,
    gender=body.gender,
    db=db
  )


@router.post("/login", response_model=TokenResponse)
async def authenticate_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
  return await auth_service.authenticate_user(
    email=form_data.username,
    password=form_data.password,
    db=db
  )
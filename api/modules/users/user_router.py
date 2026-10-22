from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database_config import get_db

from . import user_service
from .dtos.create_user_dto import CreateUserDto
from .dtos.send_penny_message_dto import Send_Penny_Message_Dto

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/")
async def create_user(body: CreateUserDto, db: Session = Depends(get_db)):
    return await user_service.create_user(
        first_name=body.first_name,
        last_name=body.last_name,
        email=body.email,
        password=body.password,
        gender=body.phone,
        db=db,
    )


@router.post("/talk-to-agent")
async def talk_to_agent(body: Send_Penny_Message_Dto):
    return await user_service.talk_to_agent(
        human_msg=body.message, user_thread_id=body.user_id
    )

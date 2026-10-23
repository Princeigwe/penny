from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer

from utils.jwt_encode_decode import get_current_user
from modules.agent_interface import agent_interface_service
from modules.agent_interface.dtos.send_penny_message_dto import Send_Penny_Message_Dto
from database_config import get_db
from sqlalchemy.orm import Session
from fastapi import Depends

router = APIRouter(prefix="/agent", tags=["Agent Interface"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


@router.post("/chat")
async def chat_with_agent(body: Send_Penny_Message_Dto, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
  user_info = await get_current_user(token, db)
  return await agent_interface_service.chat_with_agent(
    human_msg=body.message, user_thread_id=user_info.id
  )
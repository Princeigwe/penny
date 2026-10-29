from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

from utils.jwt_encode_decode import get_current_user


from database_config import get_db

from . import order_service

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.get("/own")
async def get_own_orders(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
  user_info = await get_current_user(token, db)
  return await order_service.get_own_orders(user_info.id, db)


@router.get("/own/{order_id}")
async def get_own_order_by_id(order_id: str, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
  user_info = await get_current_user(token, db)
  return await order_service.get_own_order_by_id(user_info.id, order_id, db)
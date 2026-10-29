import asyncio
import os
from typing import Optional
from database_config import SessionLocal

from dotenv import load_dotenv
from langchain_core.tools import tool
from modules.orders.order_service import agent_create_order
from .auth_tools import generate_agent_access_token



load_dotenv(override=True)



@tool(description="Settle autonomous order created by Penny agent on behalf of a user, on the system's database")
async def settle_order(
  user_id: str, 
  paid_amount: float, 
  paypal_order_id: str, 
  order_items: list[dict],
  is_autonomous: bool
):
  """
  This is responsible for settling autonomous orders created by Penny agent on behalf of a user, on the system's database. 
  """
  access_token = await generate_agent_access_token()
  with SessionLocal() as db:
    result = await agent_create_order(
      user_id, 
      paid_amount, 
      paypal_order_id, 
      order_items, 
      is_autonomous, 
      access_token,
      db
    )
  print("Order settled successfully: ", result)
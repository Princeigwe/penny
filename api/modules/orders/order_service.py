import logging

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from database_config import get_db
from .models.order_model import Order
from .models.order_item_model import Order_Item

from agentic_workflows.tools.auth_tools import decode_agent_access_token



async def create_order(
  user_id: str, 
  paid_amount: float, 
  paypal_order_id: str, 
  order_items: list[Order_Item], 
  is_autonomous: bool, 
  db: Session = Depends(get_db)
):
  try:
    order = Order(
      user_id=user_id,
      paid_amount=paid_amount,
      paypal_order_id=paypal_order_id,
      is_autonomous=is_autonomous
    )
    db.add(order)
    db.commit()

    order_items_objects = []
    for item in order_items:
      order_item = Order_Item(
        order_id=order.id,
        product_description=item["product_description"],
        quantity=item["quantity"],
        unit_price=item["unit_price"]
      )
      order_items_objects.append(order_item)
    order.order_items = order_items_objects
    db.commit()
    db.refresh(order)
    return order
  except HTTPException as e:
    logging.error(f"Error creating order")
    raise e


async def agent_create_order(
  user_id: str, 
  paid_amount: float, 
  paypal_order_id: str, 
  order_items: list[Order_Item], 
  is_autonomous: bool, 
  agent_access_token: str,
  db: Session
):
  """
  This will be used by Penny agent to create an order on behalf of a user
  """
  try:
    await decode_agent_access_token(agent_access_token)
    
    order = await create_order(
      user_id=user_id,
      paid_amount=paid_amount,
      paypal_order_id=paypal_order_id,
      order_items=order_items,
      is_autonomous=is_autonomous,
      db=db
    )
    return order
  except HTTPException as e:
    logging.error(f"Error creating order via agent")
    raise e
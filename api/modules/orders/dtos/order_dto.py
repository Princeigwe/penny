from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

class Order_Dto(BaseModel):
  id: UUID = Field(..., description="Unique identifier for the order")
  paid_amount: float = Field(..., description="Total amount paid for the order")
  paypal_order_id: str = Field(..., description="PayPal order ID associated with the order")
  is_autonomous: bool = Field(..., description="Indicates whether the order was created autonomously by an agent or manually by the user")
  created_at: datetime = Field(..., description="Timestamp when the order was created")

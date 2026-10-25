from pydantic import BaseModel, Field
from decimal import Decimal

class OrderItemDto(BaseModel):
  product_description: str = Field(..., description="Description of the product ordered")
  quantity: int = Field(..., description="Quantity of the product ordered")
  unit_price: Decimal = Field(..., description="Unit price of the product")

  def to_dict(self) -> dict:
    return self.dict()


class OrderItemsDto(BaseModel):
  order_items: list[OrderItemDto] = Field(..., description="List of order items", min_length=1)

  def to_dict(self) -> dict:
    return self.dict()
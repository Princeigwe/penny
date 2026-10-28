import uuid
from datetime import datetime

from sqlalchemy import Column, Float, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database_config import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
  from .order_model import Order

class Order_Item(Base):
  __tablename__ = "order_items"

  id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  product_description: Mapped[str] = mapped_column(String(50), nullable=False)
  unit_price: Mapped[float] = mapped_column(Float, nullable=False)
  quantity: Mapped[int] = mapped_column(Integer, nullable=False)
  created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

  
  # relationships
  order_id: Mapped[UUID(as_uuid=True)] = mapped_column(ForeignKey("orders.id"))
  order: Mapped["Order"] = relationship("Order", back_populates="order_items")
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database_config import Base
from typing import TYPE_CHECKING, List, Optional
from . order_item_model import Order_Item

if TYPE_CHECKING:
  from modules.users.models.user_model import User

class Order(Base):
  __tablename__ = "orders"

  id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  paid_amount: Mapped[float] = mapped_column(Float, nullable=False)
  paypal_order_id: Mapped[str] = mapped_column(String(100), nullable=False)
  encrypted_paypal_payment_token: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
  created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
  

  # relationships
  user_id: Mapped[UUID(as_uuid=True)] = mapped_column(ForeignKey("users.id"))
  user: Mapped["User"] = relationship("User", back_populates="orders")

  order_items: Mapped[List["Order_Item"]] = relationship("Order_Item", cascade="all, delete-orphan", back_populates="order")
import uuid
from uuid import UUID as PyUUID
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database_config import Base

from ..enums.gender import Gender
from ..enums.role import Role
from pydantic import ConfigDict, BaseModel, EmailStr
from modules.orders.models.order_model import Order


from typing import TYPE_CHECKING, List, Optional

if TYPE_CHECKING:
  from modules.orders.models.order_model import Order
  from modules.vault_tokens.models.vault_token_model import Vault_Token

class User(Base):
  __tablename__ = "users"

  id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  email: Mapped[str] = mapped_column(
    String(50), unique=True, index=True, nullable=False
  )
  password: Mapped[str] = mapped_column(String(100), nullable=False)
  first_name: Mapped[str] = mapped_column(String(50), nullable=False)
  last_name: Mapped[str] = mapped_column(String(50), nullable=False)
  gender: Mapped[Gender] = mapped_column(Enum(Gender), nullable=False)
  role: Mapped[Role] = mapped_column(Enum(Role), default=Role.CUSTOMER)
  created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

  
  # relationships
  orders: Mapped[List["Order"]] = relationship("Order", back_populates="user", cascade="all, delete-orphan")
  vault_token: Mapped[Optional["Vault_Token"]] = relationship("Vault_Token", back_populates="user", cascade="all, delete-orphan")




# this is used by pydantic to generate schema for access token response
class UserResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)  # allows reading from ORM objects

  id: PyUUID
  email: EmailStr
  first_name: str
  last_name: str
  gender: str   
  role: str      
  created_at: datetime
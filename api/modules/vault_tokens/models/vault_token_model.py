import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database_config import Base
from typing import TYPE_CHECKING


if TYPE_CHECKING:
  from modules.users.models.user_model import User



class Vault_Token(Base):
  __tablename__ = "vault_tokens"
  
  id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  # note that vault payment token is encrypted before storage
  paypal_payment_token: Mapped[str] = mapped_column(String(300), nullable=False)
  created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

  # relationships
  user_id: Mapped[UUID(as_uuid=True)] = mapped_column(ForeignKey("users.id"))
  user: Mapped["User"] = relationship("User", back_populates="vault_token")
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from database_config import Base

from ..enums.gender import Gender


class User(Base):
  __tablename__ = "users"
  
  id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  email: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
  password: Mapped[str] = mapped_column(String(100), nullable=False)
  first_name: Mapped[str] = mapped_column(String(50), nullable=False)
  last_name: Mapped[str] = mapped_column(String(50), nullable=False)
  gender: Mapped[Gender] = mapped_column(Enum(Gender), nullable=False)
  created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

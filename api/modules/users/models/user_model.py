import uuid
from uuid import UUID as PyUUID
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from database_config import Base

from ..enums.gender import Gender
from ..enums.role import Role
from pydantic import ConfigDict, BaseModel, EmailStr

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
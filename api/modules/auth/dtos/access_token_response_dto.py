from pydantic import BaseModel, Field
from typing import Optional
from modules.users.models.user_model import UserResponse

class TokenResponse(BaseModel):
  access_token: str = Field(..., description="JWT Access Token")
  token_type: str = Field(..., description="Token Type (usually 'bearer')")
  user: Optional[UserResponse] = Field(None, description="User object")

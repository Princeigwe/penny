from pydantic import BaseModel, Field


class Send_Penny_Message_Dto(BaseModel):
  user_id: str = Field(..., description="The user's ID")
  message: str = Field(..., description="The user's message")
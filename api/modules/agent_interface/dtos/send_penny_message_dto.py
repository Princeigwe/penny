from pydantic import BaseModel, Field


class Send_Penny_Message_Dto(BaseModel):
    message: str = Field(..., description="The user's message")

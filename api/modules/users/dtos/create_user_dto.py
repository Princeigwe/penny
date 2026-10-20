from pydantic import BaseModel, Field
from typing import Literal
from ..enums.gender import Gender

class CreateUserDto(BaseModel):
    first_name: str = Field(..., description="First name of the user")
    last_name: str = Field(..., description="Last name of the user")
    email: str = Field(..., description="Email of the user")
    password: str = Field(..., description="Password of the user")
    gender: Gender
from pydantic import BaseModel, Field

from ..enums.gender import Gender
from ..enums.role import Role

class CreateUserDto(BaseModel):
	first_name: str = Field(..., description="First name of the user")
	last_name: str = Field(..., description="Last name of the user")
	email: str = Field(..., description="Email of the user")
	password: str = Field(..., description="Password of the user")
	gender: Gender

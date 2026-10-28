from pydantic import BaseModel, Field


class Exchange_Vault_Setup_Token_Dto(BaseModel):
  setup_token: str = Field(..., description="The vault setup token from PayPal")
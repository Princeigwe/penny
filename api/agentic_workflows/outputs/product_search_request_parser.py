from pydantic import BaseModel, Field


class Product_Search_Request_Parser(BaseModel):
  """
  product_description: str = Field(description="product description of the query")
  gender: str = Field(description="gender described in the query")
  max_price: int = Field(description="maximum amount the user budgeted for")
  min_price: int = Field(description="minimum amount the user is willing to pay")
  """
  product_description: str = Field(..., description="product description of the query")
  gender: str = Field(..., description="gender described in the query")
  min_price: int = Field(..., description="minimum amount the user is willing to pay")
  max_price: int = Field(..., description="maximum amount the user budgeted for")

from enum import Enum


class User_Intent(str, Enum):
  SYSTEM_ENQUIRY = "system enquiry"
  PRODUCT_SEARCH = "product search"
  PRODUCT_IMAGE_SEARCH = "product image search"
  PRODUCT_URL_LOOKUP = "product URL lookup"
  E_COMMERCE_PRODUCT_SEARCH = "e-commerce product search"
  PAYMENT_EAGERNESS = "payment eagerness"
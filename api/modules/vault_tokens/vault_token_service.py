import logging

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from database_config import get_db
from .models.vault_token_model import Vault_Token
from utils.paypal_vault_management import (
  generate_paypal_vault_setup_token, 
  generate_paypal_vault_payment_token, 
  delete_paypal_vault_payment_token
)


async def generate_vault_setup_token(user_id: str):
  """
  This is responsible for generating a Paypal vault setup token
  which will be exchanged for a payment token for auto-payment of orders 
  """
  try:
    paypal_response = await generate_paypal_vault_setup_token()
    return {
      "user_id": user_id,
      "paypal_response": paypal_response
    }
  except HTTPException as e:
    logging.error(f"Error generating PayPal vault setup token")
    raise e


async def exchange_vault_setup_token_for_vault_payment_token(user_id: str, setup_token: str, db: Session = Depends(get_db)):
  try:
    paypal_response = await generate_paypal_vault_payment_token(setup_token)
    encrypted_paypal_vault_token = paypal_response["encrypted_vault_payment_token_string"]
    new_vault_token = Vault_Token(
      user_id=user_id,
      paypal_payment_token=encrypted_paypal_vault_token
    )
    
    db.add(new_vault_token)
    db.commit()
    return new_vault_token
  except HTTPException as e:
    logging.error(f"Error exchanging vault setup token for vault payment token")
    raise e
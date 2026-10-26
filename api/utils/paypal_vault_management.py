import asyncio
import logging
import os

from dotenv import load_dotenv
import requests
import uuid
from utils.symmetric_encryption import encrypt_data, decrypt_data

load_dotenv(override=True)


PAYPAL_SANDBOX_CLIENT_ID=os.environ.get("PAYPAL_BUSINESS_SANDBOX_CLIENT_ID")
PAYPAL_SANDBOX_SECRET=os.environ.get("PAYPAL_BUSINESS_SANDBOX_SECRET_KEY")
PAYPAL_SANDBOX_API_BASE_URL="https://api-m.sandbox.paypal.com"

async def get_access_token():
  try:
    response = requests.post(
      url=f"{PAYPAL_SANDBOX_API_BASE_URL}/v1/oauth2/token",
      auth=(PAYPAL_SANDBOX_CLIENT_ID, PAYPAL_SANDBOX_SECRET),
      data={"grant_type": "client_credentials"}
    )
    response.raise_for_status()
    return response.json()["access_token"]
  except Exception as e:
    logging.error(f"Error getting access token: {e}")
    return None


async def generate_paypal_vault_setup_token():
  """
  Generates a vault setup token which will be used to setup a vault payment token for automated payment
  """
  try:
    access_token = await get_access_token()
    if not access_token:
      return None
    
    response = requests.post(
      url=f"{PAYPAL_SANDBOX_API_BASE_URL}/v3/vault/setup-tokens",
      headers={
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "PayPal-Request-Id": str(uuid.uuid4()),
      },
      json={
        "payment_source": {
          "paypal": {
            "usage_type": "MERCHANT",
            "experience_context": {
              "return_url": "https://princeigwe.medium.com", # the redirect-url after a customer approves to generate a vault setup token # TODO: replace with actual frontend url
              "cancel_url": "https://google.com", # the redirect-url if a customer denies to generate a vault setup token # TODO: replace with actual frontend url
            }
          }
        }
      }
    )

    response.raise_for_status()
    print("PAYPAL API RESPONSE: ", response.json())
    data = response.json()

    # extracting important data from the API response
    payer_action_data = next(
      (link for link in data["links"] if link["rel"] == "approve"),
      None,
    )
    payer_vault_setup_approval_link = payer_action_data["href"]
    vault_setup_token_id = data["id"]

    return {
      "payer_vault_setup_approval_link": payer_vault_setup_approval_link,
      "vault_setup_token_id": vault_setup_token_id, # this will be used by the frontend to exchange it for a payment token upon successful customer approval
    }
  except Exception as e:
    logging.error(f"Error generating vault setup token: {e}")
    return None



async def generate_paypal_vault_payment_token(vault_setup_token_id: str):
  """
  Exchange approved setup token for a vault payment token for automated payments
  """
  try:
    access_token = await get_access_token()
    if not access_token:
      return None
    
    response = requests.post(
      url=f"{PAYPAL_SANDBOX_API_BASE_URL}/v3/vault/payment-tokens",
      headers={
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "PayPal-Request-Id": str(uuid.uuid4()),
      },
      json={
        "payment_source": {
          "token": {
            "id": vault_setup_token_id, 
            "type": "SETUP_TOKEN"
          }
        }
      }
    )

    response.raise_for_status()
    print("PAYPAL API RESPONSE: ", response.json())
    data = response.json()
    vault_payment_token = data["id"]

    # encrypting the vault payment token
    encrypted_vault_payment_token = encrypt_data(vault_payment_token)
    encrypted_vault_payment_token_string = encrypted_vault_payment_token.decode() # converting the encrypted bytes data to string
    return {
      "encrypted_vault_payment_token_string": encrypted_vault_payment_token_string
    }
    
  except Exception as e:
    logging.error(f"Error generating vault payment token: {e}")
    return None


##### TESTING SCRIPT ######``

if __name__ == "__main__":
  # generate_vault_setup_token_response = asyncio.run(generate_paypal_vault_setup_token())
  vault_setup_token = "8J029613N2479672X"
  paypal_vault_payment_token_response = asyncio.run(generate_paypal_vault_payment_token(vault_setup_token))


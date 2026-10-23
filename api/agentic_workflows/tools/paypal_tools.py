import asyncio
import logging
import os

from dotenv import load_dotenv
from langchain_core.tools import tool
import requests
import uuid

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
    print("PAYPAL API RESPONSE: ", response.json())
    return response.json()["access_token"]
  except Exception as e:
    logging.error(f"Error getting access token: {e}")
    return None


async def create_order(amount: int):
  try:
    access_token = await get_access_token()
    if not access_token:
      return None
    
    response = requests.post(
      url=f"{PAYPAL_SANDBOX_API_BASE_URL}/v2/checkout/orders",
      headers={
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "PayPal-Request-Id": str(uuid.uuid4()),  # idempotency key
      },
      json={
        "intent": "CAPTURE",
        "purchase_units": [
          {
            "reference_id": f"order_{str(uuid.uuid4())}",  # uniquely identifies this purchase unit
            "amount": {
              "currency_code": "USD",
              "value": str(amount)
            }
          }
        ],
        # setting up successful and cancel urls based on customer clicks
        "payment_source": {
          "paypal": {
            "experience_context": {
              "return_url": "https://princeigwe.medium.com", # customer will be redirected to this link upon successful payment # TODO: replace with actual frontend success url
              "cancel_url": "https://google.com", # customer will be redirected to this link upon cancellation of payment # TODO: replace with actual frontend cancel url
            }
          }
        },
      }
    )
    response.raise_for_status()
    print("PAYPAL API RESPONSE: ", response.json())
    data = response.json()

    # extracting important data from the API response
    payer_action_data = next(
      (link for link in data["links"] if link["rel"] == "payer-action"),
      None,
    )
    payer_action_browser_link = payer_action_data["href"]
    token = payer_action_browser_link.split("=")[1]
    order_id = data["id"]
    
    extracted_data = {
      "order_id": order_id,
      "token": token,
      "payer_action_browser_link": payer_action_browser_link,
    }
    print("EXTRACTED PAYPAL DATA: ", extracted_data)
    return extracted_data
  except Exception as e:
    logging.error(f"Error creating order: {e}")
    return None



async def capture_order(order_id):
  access_token = await get_access_token()
  if not access_token:
    return None
    
  response = requests.post(
    url=f"{PAYPAL_SANDBOX_API_BASE_URL}/v2/checkout/orders/{order_id}/capture",
    headers={
      "Authorization": f"Bearer {access_token}",
      "Content-Type": "application/json",
    },
  )
  response.raise_for_status()
  print("PAYPAL API RESPONSE: ", response.json())
  return response.json()

###### TESTING SCRIPT ######``

if __name__ == "__main__":
  create_order_response = asyncio.run(create_order(100))

  input("Press Enter after approving the payment...")
  response_order_id = create_order_response["order_id"]
  capture_order_response = asyncio.run(capture_order(response_order_id))
  print("CAPTURE ORDER RESPONSE: ", capture_order_response)
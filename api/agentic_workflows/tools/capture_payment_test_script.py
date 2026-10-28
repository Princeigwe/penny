import asyncio
import logging
import os

from dotenv import load_dotenv
import requests
import uuid

load_dotenv(override=True)


PAYPAL_SANDBOX_CLIENT_ID=os.environ.get("PAYPAL_BUSINESS_SANDBOX_CLIENT_ID")
PAYPAL_SANDBOX_SECRET=os.environ.get("PAYPAL_BUSINESS_SANDBOX_SECRET_KEY")
PAYPAL_SANDBOX_API_BASE_URL="https://api-m.sandbox.paypal.com"


print("PAYPAL_SANDBOX_CLIENT_ID", PAYPAL_SANDBOX_CLIENT_ID)
print("PAYPAL_SANDBOX_SECRET", PAYPAL_SANDBOX_SECRET)

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


async def capture_order(order_id: str):
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
  # response.raise_for_status()
  if not response.ok:
    print("PAYPAL ERROR:", response.status_code, response.text)
    raise Exception(f"Failed to capture order: {response.status_code} - {response.text}")
  print("PAYPAL CAPTURE PAYMENT API RESPONSE: ", response.json())
  return response.json()


if __name__ == "__main__":
  order_id = "6WD412855K764362A"
  asyncio.run(capture_order(order_id))
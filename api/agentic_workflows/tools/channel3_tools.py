import asyncio
import os

from channel3_sdk import AsyncChannel3
from dotenv import load_dotenv
from langchain_core.tools import tool

load_dotenv(override=True)

client = AsyncChannel3(
    api_key=os.environ.get("CHANNEL3_API_KEY")
)


@tool(description="product search tool with Channel3")
async def product_search(
	query: str, 
	min_price: int = None, 
	max_price: int = None,
	gender: str = None,
):
	search_filters = {
		"price": {"min_price": min_price, "max_price": max_price},
		"gender": gender
	}
	
	response = await client.products.search(
		query=query,
		filters=search_filters
	)
	
	products = []
	for item in response.items:
		offers = [
      {
        "retailer": o.domain,
        "price": o.price.price,
        "compare_at": o.price.compare_at_price,
        "currency": o.price.currency,
        "availability": o.availability,
        "buy_url": o.url,
      }
      for o in item.offers
    ]
		products.append({
      "id": item.id,
      "title": item.title,
      "brand": item.brands[0].name if item.brands else None,
      "rating": item.ratings.value if item.ratings else None,
      "rating_count": item.ratings.count if item.ratings else None,
      "main_image": next((i.cleaned_url or i.url for i in item.images if i.is_main_image), None),
      "offers": offers,
    })
	
	first_five_products = {"products": products[:5]}
	print(first_five_products)
	return first_five_products



###### TESTING SCRIPT ######``

if __name__ == "__main__":
  asyncio.run(
		product_search(
			query="running shoes",
			min_price=100,
			max_price=300,
			gender="female"
		)
	)

# import asyncio
import os

from channel3_sdk import AsyncChannel3
from dotenv import load_dotenv

load_dotenv(override=True)

client = AsyncChannel3(
    api_key=os.environ.get("CHANNEL3_API_KEY")
)


async def product_search(query: str):
    response = await client.products.search(query=query) # AsyncPager response from Chanel3
    products = []
    for item in response.items:
      best_offer = min(
        (o for o in item.offers if o.availability == "InStock"),
        key=lambda o: o.price.price,
        default=None,
    )
    products.append({
        "id": item.id,
        "title": item.title,
        "brand": item.brands[0].name if item.brands else None,
        "price": best_offer.price.price if best_offer else None,
        "compare_at": best_offer.price.compare_at_price if best_offer else None,
        "currency": best_offer.price.currency if best_offer else None,
        "retailer": best_offer.domain if best_offer else None,
        "rating": item.ratings.value if item.ratings else None,
        "rating_count": item.ratings.count if item.ratings else None,
        "main_image": next((i.cleaned_url or i.url for i in item.images if i.is_main_image), None),
        "buy_url": best_offer.url if best_offer else None,
    })
    print(products)
    return products



# ###### TESTING SCRIPT ######

# if __name__ == "__main__":
#     asyncio.run(product_search("running shoes"))

from pydantic import BaseModel, Field, HttpUrl
from typing import List

class SocialSellingInput(BaseModel):
    """
    Input required to set up social selling features.
    """
    platform_profiles: List[HttpUrl] = Field(..., description="URLs to the Facebook and Instagram profiles.")
    product_catalog_url: HttpUrl = Field(..., description="URL to the product catalog from an e-commerce platform like Shopify.")

class ShoppablePost(BaseModel):
    """
    Represents a social media post with tagged products.
    """
    post_url: HttpUrl
    tagged_products: List[str]

class SocialSellingSetupReport(BaseModel):
    """
    A report on the status of social commerce features.
    """
    facebook_instagram_shop_status: str = Field(..., description="The setup status of the integrated Facebook and Instagram Shop.")
    example_shoppable_posts: List[ShoppablePost] = Field(..., description="A list of example posts created with tagged products.")
from pydantic import BaseModel, Field, HttpUrl
from typing import List

class EcomPlatformManagerInput(BaseModel):
    """
    Input required to set up an e-commerce platform.
    """
    products_to_sell: List[dict]
    business_model: str = Field(..., description="The business model (e.g., 'simple digital downloads', 'extensive product line').")

class EcomPlatformSetupReport(BaseModel):
    """
    A report confirming the setup and configuration of the e-commerce platform.
    """
    selected_platform: str = Field(..., description="The e-commerce platform that was selected (e.g., 'Sellfy', 'Shopify').")
    storefront_url: HttpUrl = Field(..., description="The URL to the live storefront.")
    setup_status: str = Field(default="Completed and Live")
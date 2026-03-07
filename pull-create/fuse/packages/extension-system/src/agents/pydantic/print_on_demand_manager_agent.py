from pydantic import BaseModel, Field, HttpUrl
from typing import List

class PrintOnDemandManagerInput(BaseModel):
    """
    Input required to set up a print-on-demand workflow.
    """
    ecommerce_store_url: HttpUrl
    pod_service_name: str = Field(default="Printify", description="The name of the POD service to integrate with.")
    design_file_urls: List[HttpUrl] = Field(..., description="URLs to the design files for the merchandise.")

class ProductMockup(BaseModel):
    """
    Represents a single product mockup created and listed for sale.
    """
    product_name: str
    mockup_image_url: HttpUrl
    store_listing_url: HttpUrl

class POD_IntegrationReport(BaseModel):
    """
    A report confirming the successful integration of a POD service.
    """
    integration_status: str = Field(..., description="The status of the integration between the e-commerce store and the POD service.")
    live_product_mockups: List[ProductMockup] = Field(..., description="A list of product mockups created and listed on the store.")
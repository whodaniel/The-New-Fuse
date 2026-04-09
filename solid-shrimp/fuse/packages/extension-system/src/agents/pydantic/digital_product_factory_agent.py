from pydantic import BaseModel, Field, HttpUrl
from typing import List, Literal

class DigitalProductFactoryInput(BaseModel):
    """
    Input required to create a new digital product.
    """
    product_type: Literal["eBook", "Online Course"]
    topic: str = Field(..., description="The topic of the product.")
    audience_pain_points: List[str] = Field(..., description="The specific audience problems the product should solve.")

class DigitalProductPackage(BaseModel):
    """
    The final package containing the created digital product and related assets.
    """
    product_type: Literal["eBook", "Online Course"]
    title: str
    product_file_url: HttpUrl = Field(..., description="The URL to the main product file (e.g., the final PDF for an eBook).")
    cover_art_url: HttpUrl = Field(..., description="The URL to the product's cover art.")
    creation_summary: str = Field(..., description="A summary of the creation process, including topic research, writing, and design.")
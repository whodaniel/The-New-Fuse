from pydantic import BaseModel, Field, HttpUrl
from typing import List

class BrandProspectingInput(BaseModel):
    """
    Input required to find potential brand partners.
    """
    niche: str = Field(..., description="The influencer's specific niche.")
    brand_values: List[str] = Field(..., description="The core values of the influencer's brand.")
    is_small_influencer: bool = Field(..., description="Flag indicating if the influencer is smaller, requiring a strategy to target emerging brands.")

class BrandProspect(BaseModel):
    """
    Represents a single, vetted brand prospect.
    """
    brand_name: str
    brand_website: HttpUrl
    alignment_justification: str = Field(..., description="An explanation of why this brand aligns with the influencer's niche and values.")

class BrandProspectList(BaseModel):
    """
    A curated list of potential brand partners.
    """
    prospects: List[BrandProspect]
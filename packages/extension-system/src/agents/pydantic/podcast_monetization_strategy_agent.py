from pydantic import BaseModel, Field
from typing import List, Literal

class PodcastMonetizationStrategyInput(BaseModel):
    """
    Input required to create a podcast monetization strategy.
    """
    niche: str
    audience_summary: str

class MonetizationMethod(BaseModel):
    """
    Defines a single, prioritized method for podcast monetization.
    """
    method: Literal["sponsorships", "affiliate_marketing", "fan_funding", "proprietary_products"]
    priority: Literal["High", "Medium", "Low"]
    rationale: str = Field(..., description="Justification for why this method aligns with the niche and audience.")

class PodcastMonetizationPlan(BaseModel):
    """
    A clear, strategic monetization plan for the podcast.
    """
    overview: str = Field(..., description="A high-level summary of the monetization approach.")
    methods: List[MonetizationMethod] = Field(..., description="A prioritized list of monetization methods to pursue.")
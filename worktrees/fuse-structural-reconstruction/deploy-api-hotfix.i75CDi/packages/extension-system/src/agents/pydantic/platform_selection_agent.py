from pydantic import BaseModel, Field
from typing import List

class PlatformSelectionInput(BaseModel):
    """
    Input required to select primary social media platforms.
    """
    influencer_niche: str
    target_demographic_summary: str = Field(..., description="A summary of the target audience's demographics (e.g., 'Gen-Z', 'Professionals').")
    brand_content_style: str = Field(..., description="A description of the brand's content style (e.g., 'highly visual', 'text-based thought leadership').")

class PlatformJustification(BaseModel):
    """
    A justified recommendation for a single platform.
    """
    platform_name: str
    justification: str = Field(..., description="The data-driven reason for selecting this platform, based on audience demographics and content format alignment.")

class PlatformStrategy(BaseModel):
    """
    A prioritized strategy for social media platform focus.
    """
    primary_platform: PlatformJustification = Field(..., description="The single most important platform to focus on.")
    secondary_platforms: List[PlatformJustification] = Field(..., description="Other recommended platforms to establish a presence on.")
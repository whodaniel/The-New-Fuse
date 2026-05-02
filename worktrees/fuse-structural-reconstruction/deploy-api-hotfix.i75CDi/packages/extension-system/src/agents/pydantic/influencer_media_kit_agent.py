from pydantic import BaseModel, Field, HttpUrl
from typing import List, Dict

class InfluencerMediaKitInput(BaseModel):
    """
    Input required to generate an influencer media kit.
    """
    influencer_bio: str
    audience_demographics: dict = Field(..., description="Detailed audience demographics (e.g., from Instagram Insights).")
    performance_metrics: dict = Field(..., description="Key performance metrics like follower count, engagement rate, and reach.")
    case_studies: List[dict] = Field(..., description="Case studies from past successful campaigns.")
    rate_card: dict = Field(..., description="Pricing for various services (e.g., '1 Feed Post', '3-Story Sequence').")

class InfluencerMediaKit(BaseModel):
    """
    A complete, professional media kit for an influencer.
    """
    introduction_bio: str
    audience_demographics: dict
    key_performance_metrics: dict
    past_campaign_case_studies: List[dict]
    rate_card: dict
    media_kit_pdf_url: HttpUrl = Field(..., description="A URL to the final, professionally designed PDF version of the media kit.")
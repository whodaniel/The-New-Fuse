from pydantic import BaseModel, Field, HttpUrl
from typing import List, Literal

class ReputationManagementInput(BaseModel):
    """
    Input required to monitor and manage online reputation.
    """
    brand_name: str
    monitoring_keywords: List[str] = Field(..., description="Keywords and phrases to monitor across online platforms.")
    social_media_profiles: List[HttpUrl] = Field(..., description="URLs of social media profiles to monitor for mentions and sentiment.")
    review_site_urls: List[HttpUrl] = Field(..., description="URLs of review sites to monitor (e.g., Yelp, Google Reviews).")

class Mention(BaseModel):
    """
    Represents a single online mention of the brand.
    """
    platform: str
    url: HttpUrl
    snippet: str = Field(..., description="A short snippet of the content where the mention occurred.")
    sentiment: Literal["Positive", "Negative", "Neutral"] = Field(..., description="The sentiment of the mention.")

class ReputationManagementReport(BaseModel):
    """
    A report summarizing online mentions, sentiment, and recommended actions.
    """
    report_period: str = Field(..., description="The period covered by this reputation report.")
    total_mentions: int
    sentiment_breakdown: Dict[str, int] = Field(..., description="Count of positive, negative, and neutral mentions.")
    negative_mentions: List[Mention] = Field(..., description="A list of all negative mentions requiring attention.")
    recommended_actions: List[str] = Field(..., description="Specific actions recommended to address negative sentiment or leverage positive mentions.")
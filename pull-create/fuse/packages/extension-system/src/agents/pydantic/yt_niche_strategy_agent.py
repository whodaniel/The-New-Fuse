from pydantic import BaseModel, Field, HttpUrl
from typing import List

class YT_NicheStrategyInput(BaseModel):
    """
    Input required to identify a profitable YouTube niche.
    """
    creator_passions: List[str] = Field(..., description="A list of topics the creator is passionate about.")
    creator_expertise: List[str] = Field(..., description="A list of topics where the creator has demonstrable expertise.")

class CompetitorChannel(BaseModel):
    """
    Represents data on a competing YouTube channel within a potential niche.
    """
    channel_name: str = Field(..., description="The name of the competitor channel.")
    channel_url: HttpUrl = Field(..., description="The URL of the competitor channel.")
    subscriber_count: int = Field(..., description="The estimated number of subscribers.")
    content_strategy_summary: str = Field(..., description="A summary of their content strategy and format.")
    identified_market_gap: str = Field(..., description="A potential market gap or underserved topic area not covered by this competitor.")

class YouTubeNicheReport(BaseModel):
    """
    The final report recommending a profitable YouTube niche.
    """
    recommended_niche: str = Field(..., description="The top recommended niche for a new YouTube channel.")
    justification: str = Field(..., description="Explanation for the recommendation, focusing on CPM rates, engagement potential, and monetization opportunities.")
    competitive_analysis: List[CompetitorChannel] = Field(..., description="An analysis of the top 3-5 competitor channels in the recommended niche.")
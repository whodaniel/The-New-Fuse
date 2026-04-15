from pydantic import BaseModel, Field, HttpUrl
from typing import List

class CompetitiveIntelligenceInput(BaseModel):
    """
    Input required to run a competitive intelligence audit.
    """
    competitor_profiles: List[dict] = Field(..., description="A list of competitor profiles, including their blog, YouTube, and social media URLs.")

class CompetitorUpdate(BaseModel):
    """
    A summary of a single competitor's recent activity.
    """
    competitor_name: str
    new_content_themes: List[str] = Field(..., description="Notable new content themes or video series launched.")
    successful_campaigns: List[str] = Field(..., description="Analysis of their most successful recent social media campaigns.")
    new_monetization_methods: List[str] = Field(..., description="Any new products, services, or sponsorship types observed.")

class CompetitiveIntelligenceReport(BaseModel):
    """
    A report summarizing competitor activity and market trends.
    """
    report_period: str
    market_trend_summary: str = Field(..., description="A high-level summary of trends observed across all competitors.")
    competitor_updates: List[CompetitorUpdate]
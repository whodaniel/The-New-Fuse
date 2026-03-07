from pydantic import BaseModel, Field, HttpUrl
from typing import List, Dict

class CampaignReportingInput(BaseModel):
    """
    Input required to generate a post-campaign report.
    """
    campaign_name: str
    published_post_urls: List[HttpUrl] = Field(..., description="A list of URLs to all published sponsored content.")
    campaign_goals: dict = Field(..., description="The original goals of the campaign from the contract.")

class CampaignPerformanceReport(BaseModel):
    """
    A comprehensive performance report for a sponsored campaign.
    """
    campaign_name: str
    key_metrics: Dict[str, str] = Field(..., description="A dictionary of key metrics (reach, engagement, clicks, conversions).")
    return_on_investment_summary: str = Field(..., description="A summary demonstrating the campaign's ROI.")
    final_report_pdf_url: HttpUrl = Field(..., description="A URL to the final, client-ready PDF report.")
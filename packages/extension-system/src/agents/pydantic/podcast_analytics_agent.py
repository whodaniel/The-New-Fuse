from pydantic import BaseModel, Field
from typing import Dict, List

class PodcastAnalyticsInput(BaseModel):
    """
    Input required to generate a podcast performance report.
    """
    podcast_hosting_provider: str
    hosting_account_credentials: dict

class PodcastPerformanceReport(BaseModel):
    """
    A report on podcast performance with a focus on sustainable growth.
    """
    download_numbers: int = Field(..., description="Total downloads in the last 30 days.")
    listener_demographics: Dict[str, str] = Field(..., description="A summary of listener demographics (e.g., age, gender, location).")
    episode_drop_off_points: List[str] = Field(..., description="Analysis of where listeners stop listening in popular episodes.")
    actionable_insights: List[str] = Field(..., description="Data-driven insights for content and marketing refinement, with an emphasis on long-term strategy.")
    growth_philosophy_reminder: str = Field(default="Podcast growth is a long-term game. Focus on steady, sustainable growth, not vanity metrics.", description="A reminder of the correct mindset for growth.")
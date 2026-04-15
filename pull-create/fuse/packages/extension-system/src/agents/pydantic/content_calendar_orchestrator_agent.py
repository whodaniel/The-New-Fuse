from pydantic import BaseModel, Field, HttpUrl
from typing import List, Literal

class ContentCalendarOrchestratorInput(BaseModel):
    """
    Input required to manage and optimize the content calendar.
    """
    current_content_plans: List[dict] = Field(..., description="A list of current content plans from various agents (e.g., Blog, YouTube, Social Media).")
    audience_activity_data: dict = Field(..., description="Data on audience activity patterns across platforms.")
    product_launch_dates: List[str] = Field(..., description="Key dates for product launches or promotions.")

class ContentCalendarEntry(BaseModel):
    """
    Represents a single entry in the optimized content calendar.
    """
    content_id: str = Field(..., description="Unique identifier for the content piece.")
    title: str
    platform: str
    scheduled_date: str
    content_type: str
    cross_promotion_notes: str = Field(..., description="Notes on how this content can be cross-promoted on other platforms.")

class ContentCalendarReport(BaseModel):
    """
    A comprehensive, optimized content calendar across all platforms.
    """
    calendar_period: str = Field(..., description="The period covered by this content calendar.")
    optimized_schedule: List[ContentCalendarEntry] = Field(..., description="A list of all scheduled content entries, optimized for timing and cross-promotion.")
    strategic_notes: str = Field(..., description="High-level strategic notes on content flow and messaging.")
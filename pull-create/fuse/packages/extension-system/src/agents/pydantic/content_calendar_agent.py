from pydantic import BaseModel, Field
from typing import List, Literal
from datetime import date
from keyword_research_agent import KeywordResearchReport

class ContentCalendarInput(BaseModel):
    """
    Input required to generate a content calendar.
    """
    keyword_report: KeywordResearchReport = Field(..., description="The output from the KeywordResearchAgent.")
    publishing_frequency_days: int = Field(default=7, description="The desired number of days between each new post.")

class ScheduledPost(BaseModel):
    """
    Represents a single piece of content planned on the calendar.
    """
    planned_publish_date: date = Field(..., description="The target date for publishing the article.")
    topic_headline: str = Field(..., description="A working headline for the blog post.")
    primary_keyword: str = Field(..., description="The main target keyword for the post.")
    content_type: str = Field(..., description="The type of content to be created, based on search intent (e.g., 'How-To Guide', 'Listicle', 'Review').")
    status: Literal["Planned", "Drafting", "Optimizing", "Published"] = Field(default="Planned")

class ContentCalendar(BaseModel):
    """
    The complete, structured editorial calendar for the blog.
    """
    schedule: List[ScheduledPost] = Field(..., description="A list of all planned content, ordered by publication date.")
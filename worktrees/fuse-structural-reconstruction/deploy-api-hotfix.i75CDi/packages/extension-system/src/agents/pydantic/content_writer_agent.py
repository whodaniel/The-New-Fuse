from pydantic import BaseModel, Field
from typing import List
from content_calendar_agent import ScheduledPost

class ContentWriterInput(BaseModel):
    """
    Input required to draft a blog post.
    """
    post_details: ScheduledPost = Field(..., description="The scheduled post details from the ContentCalendar.")
    audience_persona_summary: str = Field(..., description="A summary of the target reader's persona.")
    brand_voice: str = Field(..., description="The defined brand voice for the blog.")

class BlogPostDraft(BaseModel):
    """
    The drafted, unoptimized text of a blog post.
    """
    headline: str = Field(..., description="The headline of the post.")
    full_text_content: str = Field(..., description="The full drafted text of the blog post, formatted in Markdown.")
    summary: str = Field(..., description="A brief summary of the article's key takeaways.")
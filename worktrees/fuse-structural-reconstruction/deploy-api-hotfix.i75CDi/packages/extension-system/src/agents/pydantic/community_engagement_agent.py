from pydantic import BaseModel, Field, HttpUrl
from typing import List

class CommunityEngagementInput(BaseModel):
    """
    Input required to perform community engagement tasks.
    """
    blog_url: HttpUrl = Field(..., description="The URL of the blog to monitor.")
    social_media_profiles: List[HttpUrl] = Field(..., description="URLs of the brand's social media profiles.")

class EngagementAction(BaseModel):
    """
    Represents a single engagement action taken.
    """
    platform: str = Field(..., description="The platform where the comment was found (e.g., 'Blog Comments', 'X').")
    comment_author: str = Field(..., description="The name of the person who left the comment.")
    comment_text: str = Field(..., description="The text of the comment.")
    response_text: str = Field(..., description="The text of the reply sent.")
    action_taken: str = Field(..., description="Description of the action, e.g., 'Responded to comment'.")

class CommunityEngagementReport(BaseModel):
    """
    A summary of all community engagement actions performed during a cycle.
    """
    newly_handled_engagements: List[EngagementAction] = Field(..., description="A list of all comments and messages responded to in this cycle.")
    summary: str = Field(..., description="A brief summary of community sentiment and notable interactions.")
from pydantic import BaseModel, Field, HttpUrl
from typing import List
from audience_persona_architect_agent import AudiencePersona

class TrafficGenerationInput(BaseModel):
    """
    Input required to promote a newly published blog post.
    """
    post_url: HttpUrl = Field(..., description="The URL of the blog post to be promoted.")
    post_title: str = Field(..., description="The title of the blog post.")
    post_summary: str = Field(..., description="A short summary of the blog post for sharing.")
    audience_persona: AudiencePersona = Field(..., description="The detailed audience persona to identify relevant communities.")

class PromotionActivity(BaseModel):
    """
    Represents a single promotional action taken.
    """
    platform: str = Field(..., description="The platform where the content was shared (e.g., 'X', 'Reddit', 'Email Newsletter').")
    activity_description: str = Field(..., description="A description of the action taken.")
    status: str = Field(default="Completed", description="The status of the promotional activity.")
    link_to_post: HttpUrl = Field(..., description="A direct link to the social media post or community submission.")

class TrafficGenerationReport(BaseModel):
    """
    A summary of all promotional activities executed for a blog post.
    """
    promoted_post_url: HttpUrl = Field(..., description="The blog post that was the target of the promotion.")
    activities: List[PromotionActivity] = Field(..., description="A list of all promotional activities performed.")
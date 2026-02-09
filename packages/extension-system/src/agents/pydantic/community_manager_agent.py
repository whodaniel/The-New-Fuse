from pydantic import BaseModel, Field, HttpUrl
from typing import List

class CommunityManagerInput(BaseModel):
    """
    Input required to perform community management.
    """
    profile_urls: List[HttpUrl] = Field(..., description="A list of social media profile URLs to monitor.")

class Engagement(BaseModel):
    """
    Represents a single engagement interaction.
    """
    platform: str
    interaction_type: str = Field(..., description="The type of interaction, e.g., 'Comment Response', 'DM Response'.")
    user_handle: str
    response_text: str = Field(..., description="The text of the response sent.")

class CommunityManagementReport(BaseModel):
    """
    A summary of community management activities.
    """
    engagements: List[Engagement] = Field(..., description="A list of all comments and DMs responded to during the cycle.")
    summary: str = Field(..., description="A brief summary of community sentiment and conversation trends.")
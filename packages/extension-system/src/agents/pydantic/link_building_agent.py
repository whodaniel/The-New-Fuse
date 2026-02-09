from pydantic import BaseModel, Field, HttpUrl
from typing import List, Literal

class LinkBuildingInput(BaseModel):
    """
    Input required to initiate a link-building campaign.
    """
    niche: str = Field(..., description="The blog's primary niche.")
    blog_url: HttpUrl = Field(..., description="The URL of the blog needing backlinks.")
    contact_email: str = Field(..., description="The email address to use for outreach.")

class GuestPostOpportunity(BaseModel):
    """
    Represents a potential blog for a guest posting opportunity.
    """
    target_blog_url: HttpUrl = Field(..., description="The URL of the blog to pitch.")
    contact_info: str = Field(..., description="Contact email or form for the target blog.")
    pitch_idea: str = Field(..., description="A specific, relevant article idea to pitch.")
    status: Literal["Identified", "Pitched", "Accepted", "Rejected"] = Field(default="Identified")

class LinkBuildingReport(BaseModel):
    """
    A report summarizing identified and pursued link-building opportunities.
    """
    guest_post_opportunities: List[GuestPostOpportunity] = Field(..., description="A list of potential guest posting targets.")
    collaboration_initiatives: List[str] = Field(..., description="A list of other bloggers or influencers contacted for collaboration.")
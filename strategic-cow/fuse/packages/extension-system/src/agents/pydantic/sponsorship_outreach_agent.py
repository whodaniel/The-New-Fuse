from pydantic import BaseModel, Field, HttpUrl
from typing import List

class SponsorshipOutreachInput(BaseModel):
    """
    Input required to conduct sponsorship outreach.
    """
    niche: str
    audience_demographics: dict
    download_numbers: int

class PitchedBrand(BaseModel):
    """
    Represents a single brand that has been pitched for sponsorship.
    """
    brand_name: str
    contact_email: str
    pitch_status: Literal["Pitched", "Followed-Up", "In-Negotiation", "Rejected"]
    media_kit_url: HttpUrl = Field(..., description="URL to the specific media kit sent to this brand.")

class SponsorshipOutreachReport(BaseModel):
    """
    A report summarizing all sponsorship outreach activities.
    """
    brands_pitched: List[PitchedBrand]
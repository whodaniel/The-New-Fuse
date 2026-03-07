from pydantic import BaseModel, Field, HttpUrl
from typing import Literal

class GuestBookingInput(BaseModel):
    """
    Input required to book a guest for an episode.
    """
    episode_topic: str = Field(..., description="The topic for which a guest expert is needed.")
    niche: str

class GuestBookingStatus(BaseModel):
    """
    The complete status report for a single guest booking.
    """
    guest_name: str
    guest_expertise: str
    contact_email: str
    outreach_status: Literal["Identified", "Pitched", "Scheduled", "Declined"]
    scheduled_interview_datetime: str | None = None
    guest_release_form_url: HttpUrl = Field(..., description="The URL to the guest's unique, pre-filled release form.")
    release_form_status: Literal["Sent", "Signed"] = Field(..., description="The status of the legally required podcast guest release form.")
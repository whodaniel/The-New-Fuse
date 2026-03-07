from pydantic import BaseModel, Field, HttpUrl

class GuestRelationshipManagerInput(BaseModel):
    """
    Input required to manage the post-appearance relationship with a guest.
    """
    guest_name: str
    guest_email: str
    published_episode_url: HttpUrl
    promotional_assets: List[HttpUrl] = Field(..., description="URLs to audiograms and quote cards for the guest to share.")

class GuestRelationshipReport(BaseModel):
    """
    A report confirming that post-appearance follow-up has been executed.
    """
    guest_name: str
    thank_you_email_status: str = Field(default="Sent")
    future_check_in_scheduled_date: str = Field(..., description="The date a future check-in has been scheduled for in the calendar/CRM.")
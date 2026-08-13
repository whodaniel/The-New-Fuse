from pydantic import BaseModel, Field, HttpUrl

class BrandOutreachInput(BaseModel):
    """
    Input required to craft a personalized brand pitch.
    """
    brand_prospect: dict
    influencer_value_prop: str = Field(..., description="The influencer's unique value proposition.")
    media_kit_url: HttpUrl

class BrandOutreachPackage(BaseModel):
    """
    A package containing a personalized pitch email.
    """
    email_subject: str = Field(..., description="A personalized, compelling email subject line.")
    email_body: str = Field(..., description="The full text of the personalized pitch, highlighting the influencer's value and proposing tailored collaboration ideas.")
    pitch_status: str = Field(default="Drafted for Review")
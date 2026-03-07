from pydantic import BaseModel, Field, HttpUrl

class LeadCaptureInput(BaseModel):
    """
    Input required to create and deploy a lead capture mechanism.
    """
    lead_magnet_topic: str = Field(..., description="The topic for the valuable lead magnet (e.g., 'Free checklist for starting a blog').")
    target_audience_pain_point: str = Field(..., description="The specific problem the lead magnet solves.")

class LeadMagnetPackage(BaseModel):
    """
    A complete package for a lead capture mechanism.
    """
    lead_magnet_type: str = Field(default="Free PDF Checklist", description="The type of lead magnet created.")
    lead_magnet_download_url: HttpUrl = Field(..., description="The URL to the created lead magnet file.")
    landing_page_url: HttpUrl = Field(..., description="The URL to the dedicated landing page for the opt-in form.")
    opt_in_form_embed_code: str = Field(..., description="The HTML code for the opt-in form to be embedded on other pages.")
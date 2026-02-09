from pydantic import BaseModel, Field
from typing import List

class LeadMagnetFunnelInput(BaseModel):
    """
    Input required to design a Lead Magnet Funnel.
    """
    lead_magnet_topic: str = Field(..., description="The core topic for the free lead magnet resource.")
    target_audience_pain_point: str = Field(..., description="The specific, urgent problem the lead magnet solves for the audience.")
    brand_voice: str = Field(..., description="The brand's tone and style (e.g., 'Professional', 'Casual', 'Inspirational').")

class LeadMagnetFunnelBlueprint(BaseModel):
    """
    A complete blueprint for a Lead Magnet Funnel's core assets.
    """
    lead_magnet_recommendation: str = Field(..., description="Recommended format for the lead magnet (e.g., 'Checklist', 'E-book', 'Video Tutorial').")
    squeeze_page_headline: str = Field(..., description="A compelling headline for the opt-in page.")
    squeeze_page_body_copy: str = Field(..., description="Concise copy for the squeeze page explaining the benefits.")
    thank_you_page_plan: str = Field(..., description="Instructions for the thank you page, including lead magnet delivery and a potential next step.")
    welcome_email_sequence: List[dict] = Field(..., description="A 3-part email sequence: [1] Delivery, [2] Brand Introduction, [3] Nurture.")
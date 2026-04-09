from pydantic import BaseModel, Field
from typing import List

class EmailMarketingAutomationInput(BaseModel):
    """
    Input required to build automated email sequences.
    """
    lead_magnet_topic: str
    product_to_sell: str
    brand_voice: str

class Email(BaseModel):
    """
    Represents a single email in a sequence.
    """
    subject: str
    body: str

class EmailSequenceReport(BaseModel):
    """
    A report containing the full text of all automated email sequences.
    """
    welcome_series: List[Email] = Field(..., description="A sequence to welcome new subscribers who downloaded the lead magnet.")
    nurture_sequence: List[Email] = Field(..., description="An educational sequence to build authority and trust.")
    sales_sequence: List[Email] = Field(..., description="A targeted sales campaign to promote the primary product.")
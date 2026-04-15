from pydantic import BaseModel, Field
from typing import List, Literal

class DealNegotiatorInput(BaseModel):
    """
    Input required to negotiate a brand deal.
    """
    brand_inquiry: dict = Field(..., description="The initial inquiry or offer from the brand.")
    rate_card: dict

class DealTermSheet(BaseModel):
    """
    A term sheet detailing all finalized terms of the deal.
    """
    scope_of_work: List[str] = Field(..., description="The specific, finalized deliverables.")
    compensation: dict = Field(..., description="The finalized compensation (e.g., flat fee, commission, free product, or hybrid).")
    content_usage_rights: str
    exclusivity_clause: str
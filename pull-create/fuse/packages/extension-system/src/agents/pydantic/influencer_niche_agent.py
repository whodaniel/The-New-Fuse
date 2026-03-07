from pydantic import BaseModel, Field
from typing import List

class InfluencerNicheInput(BaseModel):
    """
    Input required to identify an influencer niche.
    """
    creator_passions: List[str] = Field(..., description="A list of the creator's genuine passions.")
    creator_expertise: List[str] = Field(..., description="A list of topics where the creator has expertise.")

class InfluencerNicheReport(BaseModel):
    """
    A report recommending a highly specific and defensible influencer niche.
    """
    recommended_niche: str = Field(..., description="A highly specific, 'niched-down' area of focus.")
    [cite_start]justification: str = Field(..., description="An explanation of why this niche is viable, reduces competition, and allows for the establishment of authority. [cite: 163]")
    parent_category: str = Field(..., description="The broader category the niche belongs to (e.g., 'Fitness').")
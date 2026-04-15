from pydantic import BaseModel, Field, HttpUrl
from typing import List

class PodcastNicheAnalystInput(BaseModel):
    """
    Input required to analyze and select a podcast niche.
    """
    creator_passions: List[str] = Field(..., description="A list of topics the creator is genuinely passionate about.")
    creator_expertise: List[str] = Field(..., description="A list of topics where the creator has expertise.")

class NicheAssessment(BaseModel):
    """
    An assessment of a single potential podcast niche.
    """
    niche_name: str
    audience_demand_score: float = Field(..., ge=0.0, le=1.0, description="A score representing audience interest and search volume.")
    competition_score: float = Field(..., ge=0.0, le=1.0, description="A score representing market saturation (lower is better).")
    monetization_potential_score: float = Field(..., ge=0.0, le=1.0, description="A score representing the potential for ads, affiliates, and products.")
    justification: str = Field(..., description="A summary of the findings for this niche.")

class PodcastNicheReport(BaseModel):
    """
    The final report recommending a viable podcast niche.
    """
    recommended_niche: str = Field(..., description="The top recommended niche that avoids oversaturated markets but has sufficient audience demand.")
    alternative_niches: List[NicheAssessment] = Field(..., description="A ranked list of other viable niche options with their scores.")
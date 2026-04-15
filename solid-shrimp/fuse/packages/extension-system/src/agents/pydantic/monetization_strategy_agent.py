from pydantic import BaseModel, Field
from typing import List, Dict, Literal
from audience_persona_architect_agent import AudiencePersona

class MonetizationStrategyInput(BaseModel):
    """
    Input required to design a monetization strategy.
    """
    niche: str = Field(..., description="The blog's validated niche.")
    audience_persona: AudiencePersona = Field(..., description="The detailed persona of the target audience.")

class MonetizationTactic(BaseModel):
    """
    Represents a single, prioritized monetization tactic.
    """
    tactic: Literal["display_advertising", "affiliate_marketing", "digital_products", "sponsored_content"] = Field(..., description="The specific monetization method.")
    priority: Literal["High", "Medium", "Low"] = Field(..., description="The implementation priority for this tactic.")
    justification: str = Field(..., description="The rationale for selecting and prioritizing this tactic based on the niche and audience.")
    first_steps: str = Field(..., description="The immediate next actions to implement this tactic.")

class MonetizationStrategyPlan(BaseModel):
    """
    The complete, diversified monetization plan for the blog.
    """
    overview: str = Field(..., description="A high-level summary of the monetization strategy.")
    recommended_tactics: List[MonetizationTactic] = Field(..., description="A prioritized list of monetization tactics to implement.")
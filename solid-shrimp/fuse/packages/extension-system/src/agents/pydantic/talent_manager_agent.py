from pydantic import BaseModel, Field
from typing import List

class TalentManagerInput(BaseModel):
    """
    Input required to perform talent management functions.
    """
    creator_name: str
    niche: str
    key_performance_metrics: dict = Field(..., description="Top-level metrics demonstrating a significant level of success.")

class MajorOpportunity(BaseModel):
    """
    Represents a single, high-level opportunity for the creator.
    """
    opportunity_type: str = Field(..., description="The type of opportunity (e.g., 'Book Deal', 'Speaking Engagement').")
    details: str = Field(..., description="Details of the specific opportunity, such as a publisher to pitch or a conference to apply to.")
    next_steps: str = Field(..., description="The immediate next steps to pursue this opportunity.")

class TalentManagementStrategy(BaseModel):
    """
    A high-level career strategy and list of major opportunities.
    """
    high_level_career_strategy: str = Field(..., description="The recommended strategic focus for the next 6-12 months.")
    major_opportunities: List[MajorOpportunity] = Field(..., description="A curated list of major opportunities to pursue.")
    relationship_management_plan: str = Field(..., description="A plan for managing relationships with high-value brand partners and external agencies.")
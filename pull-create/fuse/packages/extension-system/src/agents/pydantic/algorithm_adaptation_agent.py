from pydantic import BaseModel, Field
from typing import List

class AlgorithmAdaptationInput(BaseModel):
    """
    Input required to check for and adapt to algorithm changes.
    """
    platforms: List[str] = Field(..., description="The social media platforms to check for algorithm updates (e.g., 'Instagram', 'TikTok').")
    current_content_strategy: dict = Field(..., description="The current content strategy document for the brand.")

class StrategyAdjustment(BaseModel):
    """
    A single recommended adjustment to the content strategy.
    """
    platform: str
    recommendation: str = Field(..., description="A specific, actionable adjustment to the content strategy for this platform.")
    justification: str = Field(..., description="The reason for the recommendation, based on a specific algorithm change.")

class AlgorithmUpdateBrief(BaseModel):
    """
    A brief detailing recent algorithm changes and recommended strategy adjustments.
    """
    summary_of_changes: str = Field(..., description="A high-level summary of the most important algorithm changes detected.")
    recommended_adjustments: List[StrategyAdjustment] = Field(..., description="A list of specific adjustments to make to the content strategy to maintain and optimize reach.")
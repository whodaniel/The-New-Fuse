from pydantic import BaseModel, Field, HttpUrl
from typing import List

class CognitiveBiasOptimizerInput(BaseModel):
    """
    Input required to audit a funnel asset for psychological optimization.
    """
    funnel_asset_url: HttpUrl = Field(..., description="The URL of the landing page, sales page, or checkout page to be analyzed.")
    target_conversion_goal: str = Field(..., description="The primary conversion goal of the page (e.g., 'Increase Add to Carts', 'Reduce Cart Abandonment').")

class OptimizationRecommendation(BaseModel):
    """
    A single recommendation for applying a cognitive bias.
    """
    element_to_change: str = Field(..., description="The specific page element to modify (e.g., 'Headline', 'CTA Button', 'Price Display').")
    cognitive_bias_applied: str = Field(..., description="The name of the cognitive bias being leveraged (e.g., 'Scarcity Effect', 'Anchoring Bias').")
    recommended_change: str = Field(..., description="A specific, actionable description of the change to be made.")
    expected_impact: str = Field(..., description="The hypothesized impact on the conversion goal.")

class CognitiveBiasOptimizationReport(BaseModel):
    """
    A report detailing opportunities to apply cognitive biases to a funnel asset.
    """
    asset_url: HttpUrl
    recommendations: List
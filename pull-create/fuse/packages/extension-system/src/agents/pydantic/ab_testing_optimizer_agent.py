from pydantic import BaseModel, Field, HttpUrl
from typing import List

class AB_TestInput(BaseModel):
    """
    Input required to run an A/B test.
    """
    test_name: str = Field(..., description="A descriptive name for the test (e.g., 'Video XYZ Thumbnail Test').")
    platform: str = Field(..., description="The platform where the test will run (e.g., 'YouTube', 'Email').")
    metric_to_optimize: str = Field(..., description="The key metric to track (e.g., 'Click-Through Rate', 'Open Rate').")
    variation_a_details: dict
    variation_b_details: dict
    test_duration_hours: int = Field(default=24)

class AB_TestResult(BaseModel):
    """
    The final result of a completed A/B test.
    """
    test_name: str
    winning_variation: str = Field(..., description="The name of the winning variation ('A' or 'B').")
    final_metrics: dict = Field(..., description="The final performance metrics for both variations.")
    confidence_score: float = Field(..., description="A statistical confidence score for the result.")
    action_taken: str = Field(..., description="The action taken based on the result (e.g., 'Permanently set thumbnail to Variation B').")
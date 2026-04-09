from pydantic import BaseModel, Field, HttpUrl
from typing import List

class CROProcessInput(BaseModel):
    """
    Input required to initiate and manage a CRO cycle.
    """
    optimization_goal: str = Field(..., description="The primary metric to improve (e.g., 'Increase free trial sign-ups').")
    target_url: HttpUrl = Field(..., description="The URL of the page to be optimized.")

class CROCycleReport(BaseModel):
    """
    A report summarizing the findings and results of a full CRO cycle.
    """
    research_summary: str = Field(..., description="A summary of the quantitative and qualitative research findings.")
    hypothesis: str = Field(..., description="The data-informed hypothesis that was tested, in the format 'If [Change], then [Impact] because'.")
    experiment_setup: str = Field(..., description="Details of the A/B test that was run.")
    results: str = Field(..., description="The outcome of the experiment, including the winning variation and statistical significance.")
    key_learnings: str = Field(..., description="Actionable insights about audience behavior learned from the experiment, regardless of whether it 'won' or 'lost'.")
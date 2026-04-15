from pydantic import BaseModel, Field
from typing import List

class ProductivityAndBurnoutInput(BaseModel):
    """
    Input required to assess productivity and burnout risk.
    """
    content_production_schedule: dict = Field(..., description="The current content calendar and production task list.")
    hours_worked_last_7_days: int

class ProductivityReport(BaseModel):
    """
    A report assessing burnout risk and providing recommendations.
    """
    burnout_risk_assessment: str = Field(..., description="An assessment of the current burnout risk (e.g., 'Low', 'Moderate', 'High').")
    recommendations: List[str] = Field(..., description="A list of specific recommendations, such as setting more realistic goals or automating repetitive tasks.")
    scheduled_downtime: List[str] = Field(..., description="A list of mandatory breaks and downtime added to the schedule to prevent creative exhaustion.")
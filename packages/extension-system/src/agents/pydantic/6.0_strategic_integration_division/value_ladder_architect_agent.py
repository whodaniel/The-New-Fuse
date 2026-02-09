from pydantic import BaseModel, Field
from typing import List, Dict

class ValueLadderInput(BaseModel):
    """
    Input required to architect a Value Ladder and integrated funnel ecosystem.
    """
    product_and_service_catalog: List = Field(..., description="A list of all company products/services with names, descriptions, and price points.")

class ValueLadderReport(BaseModel):
    """
    A strategic blueprint for a company's Value Ladder and the funnel ecosystem to support it.
    """
    value_ladder_map: List = Field(..., description="A list of products/services arranged in ascending order of value and price, defining each rung of the ladder.")
    integrated_funnel_ecosystem_flowchart: str = Field(..., description="A MermaidJS graph TD flowchart showing how different funnel types (e.g., Lead Magnet, Webinar) connect to move customers up the value ladder.")
    strategic_narrative: str = Field(..., description="A summary explaining how the ecosystem works to acquire customers and maximize their lifetime value.")
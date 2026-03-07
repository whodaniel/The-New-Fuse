from pydantic import BaseModel, Field
from typing import List, Dict

class CustomerJourneyMapInput(BaseModel):
    """
    Input required to generate a Customer Journey Map.
    """
    customer_persona: Dict = Field(..., description="A detailed profile of the target customer whose journey is being mapped.")
    journey_scope: str = Field(..., description="The specific journey to map (e.g., 'First-time purchase', 'Onboarding', 'Entire customer lifecycle').")
    data_sources: List[str] = Field(..., description="List of data sources to analyze (e.g., 'Google Analytics', 'CRM support tickets', 'Customer surveys').")

class CustomerJourneyMapReport(BaseModel):
    """
    A comprehensive report detailing the customer journey.
    """
    journey_map_visual: str = Field(..., description="A visual representation of the journey, often as a table or flowchart, detailing stages, actions, touchpoints, and emotions.")
    emotional_tracking_summary: str = Field(..., description="A narrative summary of the customer's emotional highs and lows throughout the journey.")
    key_pain_points: List[str] = Field(..., description="A bulleted list of the most significant points of friction or frustration for the customer.")
    improvement_opportunities: List[str] = Field(..., description="A bulleted list of actionable opportunities to improve the customer experience.")
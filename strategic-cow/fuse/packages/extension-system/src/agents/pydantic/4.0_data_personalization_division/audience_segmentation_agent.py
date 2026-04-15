from pydantic import BaseModel, Field
from typing import List, Dict

class AudienceSegmentationInput(BaseModel):
    """
    Input required to perform advanced audience segmentation.
    """
    customer_data_source: str = Field(..., description="The source of customer data (e.g., 'CRM', 'E-commerce Platform Analytics').")
    segmentation_methodologies: List[str] = Field(..., description="A list of segmentation models to apply (e.g.,).")

class AudienceSegment(BaseModel):
    """
    A detailed profile of a single audience segment.
    """
    segment_name: str
    segmentation_type: str
    description: str = Field(..., description="A qualitative description of the segment, including key characteristics and motivations.")
    key_data_points: Dict = Field(..., description="Quantitative data defining the segment (e.g., 'avg_purchase_frequency > 5', 'last_purchase_date < 30 days').")
    recommended_marketing_action: str = Field(..., description="A suggested action for this segment (e.g., 'Target with VIP loyalty offer', 'Send re-engagement campaign').")

class AudienceSegmentationReport(BaseModel):
    """
    A report containing detailed profiles of all created audience segments.
    """
    segments: List
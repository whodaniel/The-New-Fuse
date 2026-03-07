from pydantic import BaseModel, Field
from typing import List, Literal

class PodcastEquipmentInput(BaseModel):
    """
    Input required to get a podcast equipment recommendation.
    """
    budget_level: Literal["Beginner", "Professional"] = Field(..., description="The budget level for the equipment.")
    show_format: Literal["Audio-Only", "Video Podcast"] = Field(..., description="The format of the podcast.")

class EquipmentRecommendation(BaseModel):
    """
    Represents a single recommended piece of podcasting gear.
    """
    category: str = Field(..., description="The category of the equipment (e.g., 'Microphone', 'Webcam').")
    item_name: str = Field(..., description="The specific product name and model.")
    justification: str = Field(..., description="The reason this item is recommended for the specified budget and format.")

class PodcastEquipmentList(BaseModel):
    """
    The complete, categorized list of recommended podcasting equipment.
    """
    recommended_gear: List[EquipmentRecommendation] = Field(..., description="A list of all recommended equipment for a complete setup.")
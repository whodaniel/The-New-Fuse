from pydantic import BaseModel, Field
from typing import List, Literal

class EquipmentRecommendationInput(BaseModel):
    """
    Input required to get an equipment recommendation.
    """
    budget_level: Literal["Beginner", "Advanced"] = Field(..., description="The budget level for the equipment setup.")
    content_style: Literal["Talking Head Studio", "Vlogging", "Gaming Stream"] = Field(..., description="The primary style of content to be produced.")

class EquipmentItem(BaseModel):
    """
    Represents a single recommended piece of equipment.
    """
    category: Literal["Camera", "Microphone", "Lighting", "Accessory"] = Field(..., description="The category of the equipment.")
    item_name: str = Field(..., description="The specific product name and model (e.g., 'Logitech C922', 'Sony ZV-E10').")
    justification: str = Field(..., description="The reason this item is recommended for the specified budget and style.")

class EquipmentPackage(BaseModel):
    """
    The complete, categorized list of recommended equipment.
    """
    recommended_setup: List[EquipmentItem] = Field(..., description="A list of all recommended equipment for a complete setup.")
    summary: str = Field(..., description="A high-level summary of the recommended setup.")
from pydantic import BaseModel, Field
from typing import List

class PersonalBrandArchitectInput(BaseModel):
    """
    Input required to construct a personal brand identity.
    """
    influencer_niche: str = Field(..., description="The highly specific niche for the influencer.")

class VisualAesthetic(BaseModel):
    """
    Defines the visual identity of the personal brand.
    """
    color_palette: List[str] = Field(..., description="A list of specific hex color codes for the brand.")
    fonts: dict = Field(..., description="A dictionary defining the primary and secondary fonts for the brand.")

class PersonalBrandGuide(BaseModel):
    """
    A complete guide to the influencer's brand identity.
    """
    core_values: List[str] = Field(..., description="The core values the brand stands for.")
    unique_selling_proposition: str = Field(..., description="The brand's USP, explaining what makes it unique.")
    brand_voice: str = Field(..., description="A description of the brand's consistent voice (e.g., 'humorous', 'authoritative', 'inspirational').")
    visual_aesthetic: VisualAesthetic = Field(..., description="The defined visual aesthetic to be used across all platforms.")
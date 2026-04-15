from pydantic import BaseModel, Field, HttpUrl
from typing import List, Dict

class BrandIdentityInput(BaseModel):
    """
    Input required to generate a brand identity.
    """
    niche: str = Field(..., description="The validated content niche for the blog.")
    audience_summary: str = Field(..., description="A brief summary of the target audience persona.")

class BlogNameSuggestion(BaseModel):
    """
    A single suggested blog name with its domain availability status.
    """
    name: str = Field(..., description="A memorable and descriptive blog name.")
    is_domain_available: bool = Field(..., description="Indicates if the .com domain for the name is available.")

class VisualStyleGuide(BaseModel):
    """
    Defines the visual elements of the brand.
    """
    color_palette: Dict[str, str] = Field(..., description="A dictionary of key brand colors (e.g., primary, accent) with hex codes.")
    typography: Dict[str, str] = Field(..., description="A dictionary defining fonts for headings and body text.")

class BrandIdentityReport(BaseModel):
    """
    The complete output defining the blog's brand identity.
    """
    suggested_names: List[BlogNameSuggestion] = Field(..., description="A list of potential blog names, checked for domain availability.")
    brand_voice: str = Field(..., description="A description of the recommended brand voice and tone, tailored to the niche and audience.")
    visual_style_guide: VisualStyleGuide = Field(..., description="The recommended visual style for the brand.")
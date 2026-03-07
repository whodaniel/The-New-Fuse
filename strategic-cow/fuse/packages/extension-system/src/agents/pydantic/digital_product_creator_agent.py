from pydantic import BaseModel, Field, HttpUrl
from typing import List, Literal

class DigitalProductCreatorInput(BaseModel):
    """
    Input required to propose a digital product.
    """
    niche: str = Field(..., description="The blog's niche.")
    audience_pain_points: List[str] = Field(..., description="Key problems the audience wants to solve.")
    existing_top_posts: List[HttpUrl] = Field(..., description="URLs of the blog's most popular existing content.")

class DigitalProductProposal(BaseModel):
    """
    A detailed proposal for a new digital product.
    """
    product_type: Literal["eBook", "Online Course"] = Field(..., description="The type of digital product to be created.")
    title: str = Field(..., description="A compelling title for the product.")
    description: str = Field(..., description="A summary of the product and the problem it solves.")
    outline: List[str] = Field(..., description="A chapter-by-chapter or module-by-module outline of the product's content.")
    recommended_platform: str = Field(..., description="The recommended platform for selling the product (e.g., 'Sellfy', 'Easy Digital Downloads').")
    platform_integration_plan: str = Field(..., description="High-level plan for integrating the sales platform with the blog.")
from pydantic import BaseModel, Field
from typing import List

class TikTokStrategyInput(BaseModel):
    """
    Input required to create a TikTok content strategy.
    """
    personal_brand_guide: dict = Field(..., description="The influencer's core brand identity guide.")

class TikTokContentPlan(BaseModel):
    """
    A content strategy designed specifically for the TikTok platform.
    """
    hook_strategy: str = Field(..., description="A strategy for creating scroll-stopping hooks within the first three seconds of a video.")
    trending_content_approach: str = Field(..., description="An approach for leveraging trending sounds and challenges in an authentic way that aligns with the brand.")
    storytelling_format: str = Field(..., description="The primary format for telling engaging stories in short-form video.")
    collaboration_strategy: str = Field(..., description="A plan for using collaborative features like Duets and Stitches to expand reach.")
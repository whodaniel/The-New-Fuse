from pydantic import BaseModel, Field
from typing import List

class X_StrategyInput(BaseModel):
    """
    Input required to create a content strategy for X (Twitter).
    """
    personal_brand_guide: dict = Field(..., description="The influencer's core brand identity guide, especially the brand voice.")
    niche: str

class X_ContentPlan(BaseModel):
    """
    A content strategy designed for the X (Twitter) platform.
    """
    thread_strategy: str = Field(..., description="A strategy for creating valuable, multi-tweet threads to establish thought leadership.")
    engagement_strategy: str = Field(..., description="A plan for participating in trending conversations and interacting with the audience using polls.")
    visual_content_strategy: str = Field(..., description="A strategy for leveraging visual content (images, videos, GIFs) to stand out in the feed.")
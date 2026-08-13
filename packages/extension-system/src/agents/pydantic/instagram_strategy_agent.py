from pydantic import BaseModel, Field
from typing import List

class InstagramStrategyInput(BaseModel):
    """
    Input required to create an Instagram content strategy.
    """
    personal_brand_guide: dict = Field(..., description="The influencer's core brand identity guide.")

class InstagramContentPlan(BaseModel):
    """
    A comprehensive content plan for an Instagram profile.
    """
    content_pillars: List[str] = Field(..., description="A list of 3-5 key content themes for consistency.")
    reels_strategy: str = Field(..., description="The strategy for using Reels for maximum reach.")
    stories_strategy: str = Field(..., description="The strategy for using Stories for intimate engagement, including the use of interactive features like polls and Q&As.")
    feed_post_strategy: str = Field(..., description="The strategy for using high-quality feed posts and carousels for brand storytelling and education.")
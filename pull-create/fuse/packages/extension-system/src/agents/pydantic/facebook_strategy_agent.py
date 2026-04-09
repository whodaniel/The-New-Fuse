from pydantic import BaseModel, Field

class FacebookStrategyInput(BaseModel):
    """
    Input required to create a Facebook content strategy.
    """
    personal_brand_guide: dict
    niche: str

class FacebookContentPlan(BaseModel):
    """
    A content strategy focused on community building on Facebook.
    """
    facebook_group_strategy: str = Field(..., description="A detailed strategy for using a Facebook Group to foster a dedicated community, including content ideas and engagement tactics.")
    video_strategy: str = Field(..., description="A strategy for leveraging video formats like Facebook Reels and Live streams to drive engagement and build a personal connection.")
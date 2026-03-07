from pydantic import BaseModel, Field
from typing import List

class AudienceGrowthInput(BaseModel):
    """
    Input required to execute initial audience growth tactics.
    """
    profile_url: str = Field(..., description="The URL of the social media profile to grow.")
    niche: str
    value_proposition: str = Field(..., description="The clear value proposition for the brand.")

class HashtagSet(BaseModel):
    """
    A themed set of hashtags for a specific type of content.
    """
    theme: str
    hashtags: List[str]

class AudienceGrowthActionPlan(BaseModel):
    """
    An action plan for acquiring the first 1,000 followers.
    """
    optimized_bio: str = Field(..., description="A new, optimized bio that clearly states the value proposition.")
    targeted_hashtag_strategy: List[HashtagSet] = Field(..., description="A targeted hashtag strategy to improve discoverability.")
    strategic_engagement_plan: str = Field(..., description="A plan for strategic engagement, such as the '5 likes, a comment, and a follow' method.")
    initial_outreach_plan: str = Field(..., description="A plan to connect with and leverage existing personal and professional networks.")
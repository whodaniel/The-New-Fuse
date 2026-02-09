from pydantic import BaseModel, Field, HttpUrl
from typing import List, Literal

class FanFundingInput(BaseModel):
    """
    Input to set up fan funding platforms.
    """
    exclusive_content_ideas: List[str] = Field(..., description="Ideas for exclusive content for paying subscribers.")

class SubscriptionTier(BaseModel):
    """
    Defines a single paid subscription tier.
    """
    tier_name: str
    monthly_price: float
    perks: List[str]

class FanFundingSetupReport(BaseModel):
    """
    A report detailing the setup of all fan funding platforms.
    """
    subscription_platform: Literal["Spotify for Creators", "Memberful", "Supercast"]
    subscription_tiers: List[SubscriptionTier]
    subscription_page_url: HttpUrl
    donation_platform: Literal["PayPal", "Buy Me a Coffee"]
    donation_page_url: HttpUrl
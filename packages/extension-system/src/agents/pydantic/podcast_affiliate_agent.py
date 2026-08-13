from pydantic import BaseModel, Field, HttpUrl

class PodcastAffiliateInput(BaseModel):
    """
    Input to find and place affiliate links for an episode.
    """
    episode_topic: str
    raw_show_notes: str

class AffiliateOpportunity(BaseModel):
    """
    Represents a single relevant affiliate product or service.
    """
    product_name: str
    affiliate_program: str
    unique_affiliate_link: HttpUrl
    promo_code: str | None = None

class AffiliateUpdatePackage(BaseModel):
    """
    A package of updated show notes and a script for a verbal call-to-action.
    """
    updated_show_notes: str = Field(..., description="The show notes with the affiliate link and promo code added.")
    verbal_cta_script: str = Field(..., description="A short script for the host to read during the episode to promote the affiliate offer.")
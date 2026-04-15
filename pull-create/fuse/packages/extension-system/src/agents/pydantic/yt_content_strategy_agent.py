from pydantic import BaseModel, Field
from typing import List, Literal

class YT_ContentStrategyInput(BaseModel):
    """
    Input required to define a YouTube channel's content strategy.
    """
    niche: str = Field(..., description="The selected YouTube niche.")
    niche_report: dict = Field(..., description="The full niche analysis report from the YT_NicheStrategyAgent.")

class ChannelBrandIdentity(BaseModel):
    """
    Defines the branding elements for the YouTube channel.
    """
    channel_name_suggestions: List[str] = Field(..., description="A list of suggested names for the channel.")
    value_proposition: str = Field(..., description="A clear, one-sentence statement of what the channel is about and why viewers should subscribe.")
    brand_messaging: str = Field(..., description="The tone and style of communication for the channel.")
    channel_art_concept: str = Field(..., description="A description of the visual concept for the channel banner and profile picture.")

class YouTubeContentStrategy(BaseModel):
    """
    The complete content strategy document for the YouTube channel.
    """
    brand_identity: ChannelBrandIdentity = Field(..., description="The defined brand identity for the channel.")
    primary_content_formats: List[Literal["tutorials", "reviews", "vlogs", "interviews", "listicles", "educational_videos"]] = Field(..., description="The main types of video content the channel will produce.")
    posting_schedule: str = Field(..., description="The recommended sustainable posting frequency (e.g., 'One video per week, published every Tuesday').")
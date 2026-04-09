from pydantic import BaseModel, Field, HttpUrl
from typing import List

class ContentRepurposingInput(BaseModel):
    """
    Input required to repurpose a piece of cornerstone content.
    """
    cornerstone_content_url: HttpUrl = Field(..., description="The URL of the original blog post or YouTube video.")
    cornerstone_content_text: str = Field(..., description="The full text or transcript of the cornerstone content.")

class RepurposedAsset(BaseModel):
    """
    Represents a single piece of "snackable" content repurposed for a specific platform.
    """
    target_platform: str = Field(..., description="The social platform this asset is designed for (e.g., 'Instagram', 'TikTok', 'X').")
    asset_type: str = Field(..., description="The type of repurposed asset (e.g., 'Quote Card Image', 'Short Video Clip', 'Tweet Thread').")
    content: str = Field(..., description="The text content of the asset, or a description of the visual asset.")
    asset_url: HttpUrl | None = Field(default=None, description="A URL to the generated visual asset, if applicable.")

class RepurposedAssetPackage(BaseModel):
    """
    A complete package of repurposed assets derived from one cornerstone content piece.
    """
    source_content_url: HttpUrl
    assets: List[RepurposedAsset] = Field(..., description="A list of all 'snackable' assets created from the source content.")
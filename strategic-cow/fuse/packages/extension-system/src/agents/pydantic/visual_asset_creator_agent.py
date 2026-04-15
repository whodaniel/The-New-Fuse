from pydantic import BaseModel, Field, HttpUrl
from typing import List

class VisualAssetInput(BaseModel):
    """
    Input required to create or source visual assets.
    """
    post_content: str = Field(..., description="The text content of the blog post to analyze for visual opportunities.")
    brand_style_guide: dict = Field(..., description="The brand's visual style guide for creating custom graphics.")

class VisualAsset(BaseModel):
    """
    Represents a single visual asset for the blog post.
    """
    asset_url: HttpUrl = Field(..., description="The URL of the compressed image file.")
    asset_type: str = Field(..., description="The type of asset (e.g., 'Custom Graphic', 'Infographic', 'Stock Photo').")
    license_type: str = Field(..., description="The license for the asset (e.g., 'Copyright-Free', 'Royalty-Free').")
    suggested_placement: str = Field(..., description="A suggestion on where to place the image within the blog post.")

class VisualAssetPackage(BaseModel):
    """
    The complete package of visual assets for a blog post.
    """
    assets: List[VisualAsset] = Field(..., description="A list of visual assets to be embedded in the post.")
from pydantic import BaseModel, Field, HttpUrl
from typing import List, Literal

class AssetSourcerInput(BaseModel):
    """
    Input required to source licensed assets for a video.
    """
    asset_type: Literal["background_music", "sound_effect"] = Field(..., description="The type of asset to be sourced.")
    brief: str = Field(..., description="A brief description of the required asset (e.g., 'Upbeat electronic music for an intro', 'Whoosh sound effect').")

class LicensedAsset(BaseModel):
    """
    Represents a single, legally sourced asset.
    """
    asset_title: str = Field(..., description="The title of the music track or sound effect.")
    source_library: str = Field(..., description="The library the asset was sourced from (e.g., 'Epidemic Sound', 'YouTube Audio Library').")
    download_url: HttpUrl = Field(..., description="The URL to download the asset file.")
    license_details: str = Field(..., description="A summary of the licensing terms (e.g., 'Copyright-free, cleared for YouTube monetization').")

class AssetPackage(BaseModel):
    """
    A package of sourced and licensed assets ready for use in a video.
    """
    assets: List[LicensedAsset] = Field(..., description="A list of sourced assets.")
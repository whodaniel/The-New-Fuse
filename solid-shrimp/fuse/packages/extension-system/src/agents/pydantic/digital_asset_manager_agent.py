from pydantic import BaseModel, Field
from typing import List, Literal

class DigitalAssetManagerInput(BaseModel):
    """
    Input required to catalogue new assets.
    """
    project_id: str = Field(..., description="A unique identifier for the video project (e.g., 'video_2025-07-30_ai-beginners').")
    raw_file_paths: List[str] = Field(..., description="A list of local file paths for the new assets to be catalogued.")

class CataloguedAsset(BaseModel):
    """
    Represents a single asset that has been filed in the DAM system.
    """
    original_path: str = Field(..., description="The original file path of the asset.")
    new_path: str = Field(..., description="The new, organized path of the asset within the DAM structure.")
    asset_type: Literal["raw_video", "raw_audio", "graphic", "music", "sfx", "project_file"] = Field(..., description="The determined type of the asset.")

class DigitalAssetManagementReceipt(BaseModel):
    """
    A receipt confirming that assets have been catalogued in the DAM system.
    """
    project_id: str = Field(..., description="The project these assets belong to.")
    dam_root_directory: str = Field(..., description="The root directory of the project's assets.")
    catalogued_assets: List[CataloguedAsset] = Field(..., description="A list of all assets that were processed and filed.")
    status: str = Field(default="Assets Successfully Catalogued", description="The final status of the operation.")
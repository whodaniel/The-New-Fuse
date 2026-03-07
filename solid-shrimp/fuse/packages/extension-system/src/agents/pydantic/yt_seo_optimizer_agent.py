from pydantic import BaseModel, Field
from typing import List

class YT_SEO_OptimizerInput(BaseModel):
    """
    Input required to optimize a video's metadata for YouTube SEO.
    """
    video_topic: str = Field(..., description="The core topic of the video.")
    script_summary: str = Field(..., description="A summary of the video's content to extract keywords from.")

class YouTubeMetadataPackage(BaseModel):
    """
    A complete package of SEO-optimized metadata for a YouTube video.
    """
    optimized_title: str = Field(..., description="A compelling title under 60-70 characters that includes the primary keyword.")
    optimized_description: str = Field(..., description="A detailed description with keywords integrated into the first few lines and relevant links.")
    tags: List[str] = Field(..., description="A list of relevant keywords and phrases to be used as tags.")
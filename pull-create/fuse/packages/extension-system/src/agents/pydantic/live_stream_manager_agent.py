from pydantic import BaseModel, Field, HttpUrl
from typing import List

class LiveStreamManagerInput(BaseModel):
    """
    Input required to manage a live stream event.
    """
    stream_title: str
    stream_description: str
    scheduled_start_time: str
    target_platform: str = Field(..., description="The platform to stream on (e.g., 'YouTube', 'Twitch').")

class LiveStreamManagementReport(BaseModel):
    """
    A report detailing the management and outcome of a live stream event.
    """
    stream_url: HttpUrl = Field(..., description="The public URL for the scheduled live stream.")
    broadcast_key: str = Field(..., description="The stream key for the broadcast software.")
    pre_stream_promotion_status: str = Field(..., description="Confirmation that the pre-stream promotional plan was executed.")
    post_stream_vod_url: HttpUrl = Field(..., description="The URL to the recorded Video on Demand (VOD) after the stream ends.")
    repurposed_clips: List[HttpUrl] = Field(..., description="A list of URLs to shorter clips created from the VOD.")
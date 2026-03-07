from pydantic import BaseModel, Field, HttpUrl
from typing import List

class PodcastVideoEditorInput(BaseModel):
    """
    Input required to edit a video podcast.
    """
    video_track_paths: List[str] = Field(..., description="File paths to the multiple raw video tracks (e.g., host camera, guest camera).")
    final_audio_path: str = Field(..., description="File path to the final, edited master audio track.")
    brand_identity: dict = Field(..., description="Branding elements like logos and custom backgrounds.")
    guest_name: str | None = None

class VideoEditSummary(BaseModel):
    """
    A summary of a specific video editing task performed.
    """
    task: str
    details: str

class EditedVideoPodcastReport(BaseModel):
    """
    A report confirming the completion of the video podcast edit.
    """
    final_video_file_path: str = Field(..., description="The file path of the final, edited video podcast file.")
    edit_summary: List[VideoEditSummary] = Field(..., description="A summary of the key editing tasks completed.")
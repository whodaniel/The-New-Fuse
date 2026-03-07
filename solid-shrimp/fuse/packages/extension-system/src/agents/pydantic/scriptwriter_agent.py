from pydantic import BaseModel, Field
from typing import List

class ScriptwriterInput(BaseModel):
    """
    Input required to write a video script.
    """
    video_topic: str = Field(..., description="The topic of the video.")
    key_points: List[str] = Field(..., description="A list of key points or concepts that must be covered in the video.")
    call_to_action: str = Field(..., description="The desired action for the viewer to take (e.g., 'Like and subscribe').")

class VideoScript(BaseModel):
    """
    A complete, structured script for a YouTube video.
    """
    title_suggestion: str = Field(..., description="A compelling, SEO-friendly title for the video.")
    hook: str = Field(..., description="The script for the first 5-10 seconds, designed to grab viewer attention and maximize retention.")
    introduction: str = Field(..., description="The script for the introduction, setting expectations for the video.")
    body: str = Field(..., description="The main, value-packed content of the script, structured for clarity.")
    conclusion_and_cta: str = Field(..., description="The script for the conclusion, summarizing the content and delivering the call-to-action.")
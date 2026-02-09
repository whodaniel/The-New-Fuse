from pydantic import BaseModel, Field
from typing import List
from scriptwriter_agent import VideoScript

class StoryboardArtistInput(BaseModel):
    """
    Input required to create a video storyboard.
    """
    script: VideoScript = Field(..., description="The final video script.")

class StoryboardScene(BaseModel):
    """
    Represents a single scene in the storyboard.
    """
    scene_number: int = Field(..., description="The sequential number of the scene.")
    script_segment: str = Field(..., description="The corresponding lines from the script for this scene.")
    visual_description: str = Field(..., description="A description of the main action and framing of the shot (e.g., 'Medium shot of host at desk').")
    camera_angle: str = Field(..., description="The camera angle to be used (e.g., 'Eye-level', 'Top-down').")
    required_b_roll: List[str] = Field(..., description="A list of B-roll clips needed for this scene (e.g., 'Screen recording of website', 'Close-up of product').")
    on_screen_text_or_graphic: str = Field(..., description="Any text or graphics that should appear on screen during this scene.")

class Storyboard(BaseModel):
    """
    The complete visual plan for the video.
    """
    video_title: str = Field(..., description="The title of the video this storyboard is for.")
    scenes: List[StoryboardScene] = Field(..., description="A list of all scenes in sequential order.")
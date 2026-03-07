from pydantic import BaseModel, Field
from typing import List
from storyboard_artist_agent import Storyboard

class VideoEditorInput(BaseModel):
    """
    Input required to edit a video.
    """
    project_id: str = Field(..., description="The unique ID of the project, corresponding to the asset folder in the DAM.")
    storyboard: Storyboard = Field(..., description="The storyboard that dictates the edit.")
    b_roll_paths: List[str] = Field(..., description="File paths to the available B-roll footage.")
    raw_footage_paths: List[str] = Field(..., description="File paths to the primary raw video footage.")
    use_ai_editor: bool = Field(default=False, description="Flag to use AI-powered tools like Descript for faster editing.")

class EditDecision(BaseModel):
    """
    Represents a single edit decision made.
    """
    timestamp: str = Field(..., description="The timestamp in the video where the edit occurs (e.g., '00:01:15:03').")
    action: str = Field(..., description="The editing action performed (e.g., 'Trimmed pause', 'Added B-roll', 'Applied transition').")
    details: str = Field(..., description="Details about the edit, referencing the storyboard scene number.")

class VideoEditReport(BaseModel):
    """
    A report summarizing the video edit, resulting in a first-cut of the video.
    """
    project_id: str = Field(..., description="The project that was edited.")
    rough_cut_video_path: str = Field(..., description="The file path to the exported rough cut of the video.")
    edit_decision_list: List[EditDecision] = Field(..., description="A list of key decisions made during the edit to improve pacing and visual interest.")
    status: str = Field(default="Rough Cut Completed", description="The status of the video edit.")
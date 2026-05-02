from pydantic import BaseModel, Field
from typing import List

class AudioRecordingInput(BaseModel):
    """
    Input required to generate a pre-recording checklist.
    """
    environment_description: str = Field(..., description="A description of the recording environment.")
    microphone_model: str = Field(..., description="The model of the microphone being used.")

class PreFlightCheck(BaseModel):
    """
    Represents a single best practice check before recording.
    """
    category: str = Field(..., description="The area being checked (e.g., 'Environment', 'Microphone Technique', 'Audio Levels').")
    check_item: str = Field(..., description="The specific best practice to confirm.")
    status: Literal["Pending Confirmation", "Confirmed"] = Field(default="Pending Confirmation")

class RecordingPreFlightChecklist(BaseModel):
    """
    A checklist of best practices to be confirmed before starting a recording session.
    """
    checklist: List[PreFlightCheck] = Field(..., description="A list of essential checks to ensure a high-quality recording.")
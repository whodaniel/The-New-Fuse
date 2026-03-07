from pydantic import BaseModel, Field
from typing import List

class PodcastAudioEditorInput(BaseModel):
    """
    Input required to edit raw podcast audio.
    """
    raw_audio_file_path: str = Field(..., description="The file path of the raw, unedited audio recording.")

class AudioEditAction(BaseModel):
    """
    Represents a single editing or processing action taken on the audio.
    """
    action: str = Field(..., description="The action taken (e.g., 'Trimmed Start/End', 'Mistake Removal', 'Noise Reduction', 'Equalization', 'Compression').")
    details: str = Field(..., description="A summary of the edit performed.")

class EditedAudioReport(BaseModel):
    """
    A report confirming the completion of audio post-production.
    """
    edited_audio_file_path: str = Field(..., description="The file path of the final, edited audio file.")
    actions_taken: List[AudioEditAction] = Field(..., description="A log of all editing and processing actions performed.")
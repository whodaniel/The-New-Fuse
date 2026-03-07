from pydantic import BaseModel, Field
from typing import List, Literal

class PodcastFormatDesignerInput(BaseModel):
    """
    Input required to select a podcast format.
    """
    niche: str
    creator_strengths: List[Literal["Solo Speaking", "Interviewing", "Storytelling", "Debating"]] = Field(..., description="A list of the creator's primary communication strengths.")

class PodcastFormatDefinition(BaseModel):
    """
    The final definition of the selected podcast format.
    """
    selected_format: Literal["solo", "co-hosted", "interview-based", "narrative_storytelling"] = Field(..., description="The chosen format for the podcast.")
    justification: str = Field(..., description="The rationale for choosing this format based on niche, creator strengths, and sustainability.")
    sustainability_assessment: str = Field(..., description="An assessment of why this format can be produced consistently to avoid 'podfade'.")
from pydantic import BaseModel, Field
from typing import List

class EpisodePlannerInput(BaseModel):
    """
    Input required to brainstorm a bank of episode topics.
    """
    niche: str
    show_format: str = Field(..., description="The chosen format of the show (e.g., 'interview-based').")

class EpisodeIdea(BaseModel):
    """
    Represents a single, outlined episode idea.
    """
    working_title: str = Field(..., description="A working title for the episode.")
    description: str = Field(..., description="A one-paragraph summary of the episode's content and value proposition.")
    key_talking_points: List[str] = Field(..., description="A bulleted list of key points to be covered.")

class EpisodeTopicBank(BaseModel):
    """
    A substantial bank of episode ideas to provide a content buffer.
    """
    episodes: List[EpisodeIdea] = Field(..., description="A list of at least 10-30 potential episode topics.")
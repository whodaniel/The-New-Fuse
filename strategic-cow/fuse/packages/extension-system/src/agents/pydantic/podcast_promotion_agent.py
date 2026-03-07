from pydantic import BaseModel, Field, HttpUrl
from typing import List

class PodcastPromotionInput(BaseModel):
    """
    Input required to promote a new podcast episode.
    """
    episode_title: str
    episode_url: HttpUrl
    episode_audio_path: str
    guest_contact_email: str | None = None

class PromotionTask(BaseModel):
    """
    Represents a single promotional task executed for the new episode.
    """
    task_description: str
    platform: str
    status: str = Field(default="Completed")
    link_to_asset: HttpUrl | None = None

class PodcastPromotionReport(BaseModel):
    """
    A report summarizing all marketing actions taken for a new episode.
    """
    promoted_episode_title: str
    tasks_completed: List[PromotionTask]
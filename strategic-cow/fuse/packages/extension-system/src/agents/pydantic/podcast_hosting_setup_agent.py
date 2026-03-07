from pydantic import BaseModel, Field, HttpUrl
from typing import List

class PodcastHostingSetupInput(BaseModel):
    """
    Input required to set up podcast hosting.
    """
    show_title: str
    show_description: str
    show_cover_art_url: HttpUrl
    initial_episode_files: List[str] = Field(..., description="File paths to the initial episodes to be uploaded.")

class PodcastHostingReport(BaseModel):
    """
    A report confirming the setup of the podcast hosting account.
    """
    hosting_provider: str = Field(..., description="The selected hosting provider (e.g., 'Buzzsprout', 'Podbean').")
    account_status: str = Field(default="Active", description="The status of the hosting account.")
    rss_feed_url: HttpUrl = Field(..., description="The newly generated RSS feed URL for the podcast.")
    uploaded_episodes_count: int = Field(..., description="The number of initial episodes successfully uploaded.")
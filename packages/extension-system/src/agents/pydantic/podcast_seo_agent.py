from pydantic import BaseModel, Field, HttpUrl

class PodcastSEO_Input(BaseModel):
    """
    Input required to perform SEO on podcast assets.
    """
    show_title: str
    episode_title: str
    raw_show_notes: str
    full_episode_transcript: str
    dedicated_website_url: HttpUrl

class PodcastSEO_Package(BaseModel):
    """
    A package of SEO-optimized assets for a podcast episode.
    """
    optimized_episode_title: str = Field(..., description="The episode title, optimized with a target keyword.")
    optimized_show_notes: str = Field(..., description="The show notes, optimized with relevant keywords.")
    transcript_post_url: HttpUrl = Field(..., description="The URL of the new page on the dedicated website where the full transcript was posted.")
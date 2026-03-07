from pydantic import BaseModel, Field, HttpUrl
from typing import List

class PodcastDistributionInput(BaseModel):
    """
    Input required to distribute a podcast to directories.
    """
    rss_feed_url: HttpUrl = Field(..., description="The podcast's primary RSS feed URL from the hosting provider.")

class DirectorySubmission(BaseModel):
    """
    Represents the submission status to a single podcast directory.
    """
    directory_name: str = Field(..., description="The name of the directory (e.g., 'Apple Podcasts', 'Spotify').")
    submission_status: str = Field(..., description="The status of the submission (e.g., 'Submitted, Pending Approval', 'Live').")

class PodcastDistributionReport(BaseModel):
    """
    A report detailing the submission status across all major podcast directories.
    """
    submissions: List[DirectorySubmission] = Field(..., description="A list of submissions to major podcast directories.")
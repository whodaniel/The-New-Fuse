from pydantic import BaseModel, Field, HttpUrl
from typing import List

class ContentRefreshInput(BaseModel):
    """
    Input required to identify and plan content refreshes.
    """
    blog_url: HttpUrl = Field(..., description="The root URL of the blog to analyze.")
    performance_data: dict = Field(..., description="The latest output from the AnalyticsAndReportingAgent.")
    post_age_threshold_days: int = Field(default=365, description="The minimum age of a post to be considered for a refresh.")
    traffic_threshold_monthly: int = Field(default=100, description="The monthly traffic threshold below which a post is considered underperforming.")

class RefreshRecommendation(BaseModel):
    """
    A specific recommendation for refreshing a single blog post.
    """
    post_to_refresh_url: HttpUrl
    reason_for_refresh: str = Field(..., description="The data-driven reason for flagging this post (e.g., 'Declining traffic', 'Outdated year in title').")
    suggested_content_updates: List[str] = Field(..., description="A list of specific content sections to add, remove, or update.")
    new_keywords_to_target: List[str] = Field(..., description="A list of new or secondary keywords to incorporate.")
    internal_links_to_add: List[HttpUrl] = Field(..., description="A list of URLs to newer blog posts that should be linked to from this article.")

class ContentRefreshPlan(BaseModel):
    """
    A complete plan outlining which posts to refresh and how to refresh them.
    """
    plan_date: str
    posts_to_refresh: List[RefreshRecommendation]
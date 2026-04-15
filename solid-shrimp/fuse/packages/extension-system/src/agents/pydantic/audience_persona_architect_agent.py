from pydantic import BaseModel, Field, HttpUrl
from typing import List, Dict, Literal

class PersonaInput(BaseModel):
    """
    Input required to generate an audience persona.
    """
    niche: str = Field(..., description="The validated content niche.")
    platform: Literal["blog", "youtube", "podcast", "instagram", "tiktok", "x", "facebook"] = Field(..., description="The primary platform for which the persona is being developed.")

class Demographics(BaseModel):
    """
    Demographic information for the persona.
    """
    age_range: str = Field(..., example="25-34")
    gender_distribution: str = Field(..., example="60% Female, 40% Male")
    location: str = Field(..., example="Urban areas in North America")
    education_level: str = Field(..., example="Bachelor's Degree or higher")
    job_title: str = Field(..., example="Software Engineer, Marketing Manager")

class Psychographics(BaseModel):
    """
    Psychographic details of the persona, including values, interests, and pain points.
    """
    values_and_beliefs: List[str] = Field(..., description="Core values that guide their decisions.")
    interests_and_hobbies: List[str] = Field(..., description="Topics and activities they are passionate about outside of the core niche.")
    pain_points_and_challenges: List[str] = Field(..., description="Specific problems they face that are relevant to the niche.")
    goals_and_aspirations: List[str] = Field(..., description="What they are trying to achieve in relation to the niche.")

class MediaConsumptionHabits(BaseModel):
    """
    How the persona consumes content and interacts online.
    """
    preferred_content_formats: List[Literal["long-form_articles", "short_videos", "in-depth_videos", "podcasts", "infographics", "live_streams"]]
    active_social_platforms: List[str] = Field(..., description="Social media platforms they use daily.")
    trusted_influencers_or_sources: List[str] = Field(..., description="Other creators or publications they follow and trust.")
    online_communities: List[HttpUrl] = Field(..., description="Links to relevant subreddits, Facebook groups, or forums they frequent.")

class AudiencePersona(BaseModel):
    """
    The complete, detailed audience persona output.
    """
    persona_name: str = Field(..., description="A memorable name for the persona, e.g., 'Ambitious Alex'.")
    persona_quote: str = Field(..., description="A short quote that encapsulates the persona's primary motivation.")
    demographics: Demographics
    psychographics: Psychographics
    media_consumption_habits: MediaConsumptionHabits
    summary_narrative: str = Field(..., description="A brief story describing a day in the life of this persona and how they interact with the niche.")
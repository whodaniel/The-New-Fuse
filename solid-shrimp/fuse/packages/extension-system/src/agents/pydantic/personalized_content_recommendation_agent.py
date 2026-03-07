from pydantic import BaseModel, Field, HttpUrl
from typing import List, Dict

class PersonalizedContentRecommendationInput(BaseModel):
    """
    Input required to generate personalized content recommendations.
    """
    user_id: str = Field(..., description="Unique identifier for the user.")
    user_preferences: Dict[str, Any] = Field(..., description="A dictionary of user preferences (e.g., topics of interest, preferred content formats).")
    user_history: List[Dict[str, Any]] = Field(..., description="A list of the user's past interactions (e.g., viewed content, purchased products).")
    available_content: List[Dict[str, Any]] = Field(..., description="A list of all available content pieces with their metadata.")

class RecommendedContent(BaseModel):
    """
    Represents a single piece of content recommended to the user.
    """
    content_id: str = Field(..., description="Unique identifier for the recommended content.")
    title: str
    content_type: str
    url: HttpUrl
    relevance_score: float = Field(..., description="A score indicating the relevance of the content to the user.")
    recommendation_reason: str = Field(..., description="A brief explanation of why this content was recommended.")

class PersonalizedContentRecommendationReport(BaseModel):
    """
    A report containing personalized content recommendations for a specific user.
    """
    user_id: str
    recommendations: List[RecommendedContent] = Field(..., description="A list of personalized content recommendations.")
    recommendation_strategy_summary: str = Field(..., description="A summary of the strategy used to generate these recommendations.")
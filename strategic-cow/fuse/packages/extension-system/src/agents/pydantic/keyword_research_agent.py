from pydantic import BaseModel, Field
from typing import List, Literal

class KeywordResearchInput(BaseModel):
    """
    Input required to perform keyword research.
    """
    niche: str = Field(..., description="The validated content niche.")
    audience_pain_points: List[str] = Field(..., description="A list of problems the target audience faces.")

class KeywordData(BaseModel):
    """
    Detailed data for a single keyword.
    """
    keyword: str = Field(..., description="The keyword phrase.")
    type: Literal["long-tail", "gold_nugget", "informational", "transactional"] = Field(..., description="The classification of the keyword.")
    monthly_search_volume: int = Field(..., description="Estimated monthly search volume.")
    competition_level: Literal["low", "medium", "high"] = Field(..., description="The competitive difficulty to rank for this keyword.")
    search_intent: str = Field(..., description="The likely user intent behind the search (e.g., 'how-to guide', 'product review').")

class KeywordResearchReport(BaseModel):
    """
    The complete output of the keyword research process.
    """
    primary_target_keywords: List[KeywordData] = Field(..., description="A list of high-priority keywords to build cornerstone content around.")
    secondary_target_keywords: List[KeywordData] = Field(..., description="A list of supporting keywords for regular blog posts.")
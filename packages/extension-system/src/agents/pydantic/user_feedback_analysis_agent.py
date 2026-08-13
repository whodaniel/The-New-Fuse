from pydantic import BaseModel, Field
from typing import List, Dict, Literal

class UserFeedbackInput(BaseModel):
    """
    Input required to analyze qualitative user feedback.
    """
    feedback_source: Literal["comments", "dms", "survey_responses", "forum_discussions", "review_sites"]
    feedback_data: List[str] = Field(..., description="A list of raw text strings containing user feedback.")
    analysis_period: str = Field(..., description="The time period the feedback covers (e.g., 'Last 30 days', 'Q1 2024').")

class FeedbackTheme(BaseModel):
    """
    Represents a recurring theme or topic identified in the feedback.
    """
    theme_name: str = Field(..., description="A concise name for the identified theme.")
    sentiment: Literal["Positive", "Negative", "Neutral", "Mixed"] = Field(..., description="The overall sentiment associated with this theme.")
    key_quotes: List[str] = Field(..., description="Representative quotes from the feedback data for this theme.")
    actionable_insights: List[str] = Field(..., description="Specific, actionable insights derived from this theme.")

class UserFeedbackAnalysisReport(BaseModel):
    """
    A report summarizing qualitative user feedback and actionable insights.
    """
    report_title: str = Field(..., description="Title of the feedback analysis report.")
    analysis_period: str
    total_feedback_items: int
    identified_themes: List[FeedbackTheme] = Field(..., description="A list of all identified themes with their sentiment and insights.")
    overall_sentiment_summary: str = Field(..., description="A high-level summary of the overall sentiment across all feedback.")
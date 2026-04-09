from pydantic import BaseModel, Field, HttpUrl
from typing import List, Dict, Literal, Annotated
from typing_extensions import TypedDict

class NicheInputParameters(BaseModel):
    """
    Input parameters provided by the user to guide the niche analysis.
    """
    creator_passions: List[str] = Field(..., description="A list of topics the creator is genuinely passionate about.")
    creator_expertise: Dict[str, int] = Field(..., description="A dictionary of topics where the creator has expertise, rated on a scale of 1-10.")
    monetization_goals: List[Literal["ads", "affiliate", "digital_products", "sponsorships"]] = Field(..., description="The desired monetization methods.")
    target_audience_profile: str = Field(..., description="A brief description of the ideal audience the creator wants to reach.")

class CompetitorData(TypedDict):
    """
    A TypedDict for performance, detailing data on a single competitor in a potential niche.
    """
    competitor_url: HttpUrl
    platform: Literal["blog", "youtube", "podcast"]
    estimated_monthly_traffic_or_views: int
    top_keywords: List[str]
    monetization_methods_observed: List[str]

class NicheViabilityScores(BaseModel):
    """
    A scoring model to quantitatively assess the viability of a potential niche.
    Scores are normalized from 0.0 to 1.0.
    """
    market_demand_score: float = Field(..., ge=0.0, le=1.0, description="Score representing search volume and audience interest.")
    competition_score: float = Field(..., ge=0.0, le=1.0, description="Score representing the saturation and authority of existing competitors (lower is better).")
    monetization_potential_score: float = Field(..., ge=0.0, le=1.0, description="Score based on the availability and profitability of monetization methods.")
    creator_alignment_score: float = Field(..., ge=0.0, le=1.0, description="Score representing the alignment with the creator's passion and expertise.")
    overall_viability_score: float = Field(..., ge=0.0, le=1.0, description="A weighted average of the other scores.")

class NicheAnalysisReport(BaseModel):
    """
    The final, comprehensive output model for the NicheAnalystAgent.
    """
    recommended_niche: str = Field(..., description="The top recommended niche.")
    justification: str = Field(..., description="A detailed explanation for the recommendation, referencing the data found.")
    viability_scores: NicheViabilityScores = Field(..., description="The quantitative scoring for the recommended niche.")
    alternative_niches: List[Dict[str, NicheViabilityScores]] = Field(..., description="A ranked list of other viable niche options with their scores.")
    competitor_analysis: List[CompetitorData] = Field(..., description="An analysis of the top 3-5 competitors in the recommended niche.")
    suggested_keywords: List[str] = Field(..., description="A list of initial long-tail keywords to target for content creation.")
    trend_analysis_summary: str = Field(..., description="A summary of the niche's trend trajectory (growing, stable, or declining).")
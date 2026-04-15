from pydantic import BaseModel, Field, HttpUrl
from typing import List, Dict

class AnalyticsAndReportingInput(BaseModel):
    """
    Input required to generate a performance report.
    """
    blog_url: HttpUrl = Field(..., description="The URL of the blog to analyze.")
    reporting_period_days: int = Field(default=30, description="The number of past days to include in the report.")

class KpiMetric(BaseModel):
    """
    Represents a single Key Performance Indicator (KPI).
    """
    metric_name: str = Field(..., description="The name of the metric (e.g., 'Pageviews', 'Bounce Rate').")
    value: str = Field(..., description="The value of the metric for the reporting period.")
    trend_percentage: float = Field(..., description="The percentage change from the previous period.")

class PerformanceReport(BaseModel):
    """
    A comprehensive report of the blog's performance with actionable insights.
    """
    report_period: str = Field(..., description="The date range covered by this report.")
    key_metrics: List[KpiMetric] = Field(..., description="A list of key performance indicators.")
    top_performing_pages: Dict[HttpUrl, int] = Field(..., description="A dictionary of the top 10 pages by pageviews.")
    top_traffic_sources: Dict[str, int] = Field(..., description="A dictionary of the top traffic sources by session count.")
    actionable_insights: List[str] = Field(..., description="Data-driven recommendations for the ContentCalendarAgent and MonetizationStrategyAgent.")
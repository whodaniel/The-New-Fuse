from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class AnalyticsAndReportingAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class AnalyticsAndReportingAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class AnalyticsAndReportingAgentMetadata(AgentMetadataBase):
    agent_id: str = "analytics-and-reporting-agent"
    name: str = "analytics-and-reporting-agent"
    description: str = "MUST BE USED to monitor blog performance by tracking key metrics in Google Analytics. It generates regular reports with actionable data to enable a continuous cycle of improvement."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="GoogleAnalyticsAPI", description="", version="1.0.0")]
    tools: List[str] = ["GoogleAnalyticsAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a data analyst who turns raw data into strategic insights. Your function\nis to be the data brain of the blogging division. You monitor key metrics,\nidentify trends, and provide clear, actionable recommendations that guide\ncontent and monetization strategy.\n\nYour operational workflow is as follows:\n\n1.  **Parse Input:** Receive and parse the `AnalyticsAndReportingInput`.\n2.  **Connect to Analytics:** Use the `GoogleAnalyticsAPI` to connect to the\n    blog's analytics account.\n3.  **Fetch Key Metrics:** Pull key metrics for the specified\n    `reporting_period_days`. This must include traffic sources, pageviews,\n    bounce rate, and conversion rates for monetization efforts.\n4.  **Analyze Data and Trends:** Compare the current period's data to the\n    previous period to identify trends. Identify the top-performing content and\n    the most effective traffic sources.\n5.  **Generate Actionable Insights:** Synthesize your analysis into actionable\n    recommendations. For example: \"The post 'How to Grow Roses' drove 30% of new\n    traffic from Pinterest; create more content targeting that keyword and\n    platform.\" or \"The affiliate link for Product X has a 5% conversion rate;\n    feature it more prominently.\"\n6.  **Generate Report:** Compile all metrics and insights into the\n    `PerformanceReport` Pydantic model. This report provides the data feedback\n    loop to the `ContentCalendarAgent` and `MonetizationStrategyAgent` for\n    continuous improvement. The output must be a single, valid JSON object."
    input_model: str = "AnalyticsAndReportingAgentInput"
    output_model: str = "AnalyticsAndReportingAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "AnalyticsAndReportingAgentInput",
    "AnalyticsAndReportingAgentOutput",
    "AnalyticsAndReportingAgentMetadata",
]

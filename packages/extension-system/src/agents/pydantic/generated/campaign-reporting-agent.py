from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class CampaignReportingAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class CampaignReportingAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class CampaignReportingAgentMetadata(AgentMetadataBase):
    agent_id: str = "campaign-reporting-agent"
    name: str = "campaign-reporting-agent"
    description: str = "MUST BE USED after a campaign concludes to compile a comprehensive performance report for the brand. The report details key metrics (reach, engagement, clicks, conversions) to demonstrate ROI and secure long-term partnerships."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="PDFGeneratorAPI", description="", version="1.0.0"), AgentCapability(name="SocialMediaAPI", description="", version="1.0.0")]
    tools: List[str] = ["SocialMediaAPI", "PDFGeneratorAPI"]
    tags: List[str] = []
    system_prompt: str = "You are an account manager and data analyst for an influencer agency. Your\nfinal, critical task in a campaign is to compile a comprehensive performance\nreport for the brand. Your goal is to clearly demonstrate the return on\ninvestment (ROI) to reinforce the influencer's value and secure long-term\npartnerships.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive the `CampaignReportingInput`.\n2.  **Fetch Metrics:** For each URL in `published_post_urls`, use the\n    `SocialMediaAPI` to fetch all relevant performance metrics, including reach,\n    engagement (likes, comments, shares), clicks, and conversions if trackable.\n3.  **Calculate ROI:** Synthesize the key metrics to create a\n    `return_on_investment_summary` that demonstrates the value delivered in\n    relation to the `campaign_goals`.\n4.  **Generate PDF Report:** Use the `PDFGeneratorAPI` to compile all data into\n    a client-ready, professional PDF report.\n5.  **Generate Output:** Create the final `CampaignPerformanceReport` Pydantic\n    model, including the link to the PDF. The output must be a single, valid\n    JSON object."
    input_model: str = "CampaignReportingAgentInput"
    output_model: str = "CampaignReportingAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "CampaignReportingAgentInput",
    "CampaignReportingAgentOutput",
    "CampaignReportingAgentMetadata",
]

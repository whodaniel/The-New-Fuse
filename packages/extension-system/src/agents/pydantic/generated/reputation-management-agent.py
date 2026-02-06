from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class ReputationManagementAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class ReputationManagementAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class ReputationManagementAgentMetadata(AgentMetadataBase):
    agent_id: str = "reputation-management-agent"
    name: str = "reputation-management-agent"
    description: str = "MUST BE USED to proactively monitor for negative comments, reviews, or potential PR crises. It assesses severity, proposes response strategies, and aims to protect and enhance brand image."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="SentimentAnalysisAPI", description="", version="1.0.0"), AgentCapability(name="SocialMediaMonitoringAPI", description="", version="1.0.0")]
    tools: List[str] = ["SocialMediaMonitoringAPI", "SentimentAnalysisAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a vigilant Reputation Manager and Crisis Communications Specialist. You\nunderstand that a brand's image is its most valuable asset. Your function is to\ncontinuously monitor the online landscape, detect potential threats or\nopportunities to reputation, and recommend strategic responses.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive the `ReputationManagementInput`. Access\n    `monitoring_keywords`, `social_media_profiles`, and `review_site_urls`.\n2.  **Monitor Online Mentions:** Use the `SocialMediaMonitoringAPI` to scan for\n    mentions of the `brand_name` and `monitoring_keywords` across all specified\n    platforms and sites.\n3.  **Analyze Sentiment:** For each detected mention, use the\n    `SentimentAnalysisAPI` to determine its `sentiment` (Positive, Negative,\n    Neutral).\n4.  **Identify Critical Issues:** Flag all `Negative` mentions and assess their\n    potential impact. Prioritize those that could escalate into a PR crisis.\n5.  **Formulate Recommended Actions:** For negative mentions, propose specific\n    `recommended_actions` (e.g., 'Draft a public response', 'Initiate private\n    outreach', 'Escalate to legal'). For positive mentions, suggest ways to\n    leverage them (e.g., 'Share as testimonial').\n6.  **Generate Report:** Compile the `report_period`, `total_mentions`,\n    `sentiment_breakdown`, `negative_mentions`, and `recommended_actions` into\n    the `ReputationManagementReport` Pydantic model. The output must be a\n    single, valid JSON object."
    input_model: str = "ReputationManagementAgentInput"
    output_model: str = "ReputationManagementAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "ReputationManagementAgentInput",
    "ReputationManagementAgentOutput",
    "ReputationManagementAgentMetadata",
]

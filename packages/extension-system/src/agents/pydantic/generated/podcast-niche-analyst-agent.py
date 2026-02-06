from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class PodcastNicheAnalystAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class PodcastNicheAnalystAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class PodcastNicheAnalystAgentMetadata(AgentMetadataBase):
    agent_id: str = "podcast-niche-analyst-agent"
    name: str = "podcast-niche-analyst-agent"
    description: str = "MUST BE USED to identify a viable podcast niche. It balances the creator's passion and expertise with audience interest, competitive landscape, and monetization potential, specifically seeking to avoid oversaturated markets."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="PodcastDirectoryAPI", description="", version="1.0.0"), AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch", "PodcastDirectoryAPI"]
    tags: List[str] = []
    system_prompt: str = "You are an experienced podcast producer and market analyst. Your specialty is\nidentifying untapped or underserved niches in the podcasting landscape that\noffer a strong potential for building a community and generating revenue.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `PodcastNicheAnalystInput`.\n2.  **Assess Competitive Landscape:** For each potential niche, use the\n    `PodcastDirectoryAPI` and `WebSearch` to analyze the competitive landscape.\n    Your goal is to specifically seek out niches that are not oversaturated, as\n    this is a key success factor.\n3.  **Evaluate Audience Demand:** Gauge audience interest for the niche by\n    searching for related discussions on forums and social media.\n4.  **Evaluate Monetization Potential:** Research the potential for monetization\n    within the niche, including the availability of relevant affiliate programs\n    or the viability of sponsorships.\n5.  **Score and Recommend:** Quantify your findings for each niche and populate\n    the `NicheAssessment` model. Select the `recommended_niche` that strikes the\n    best balance between the creator's passion/expertise, audience demand, and a\n    manageable competitive landscape.\n6.  **Generate Report:** Compile the recommendation and alternative assessments\n    into the `PodcastNicheReport` Pydantic model. The output must be a single,\n    valid JSON object."
    input_model: str = "PodcastNicheAnalystAgentInput"
    output_model: str = "PodcastNicheAnalystAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "PodcastNicheAnalystAgentInput",
    "PodcastNicheAnalystAgentOutput",
    "PodcastNicheAnalystAgentMetadata",
]

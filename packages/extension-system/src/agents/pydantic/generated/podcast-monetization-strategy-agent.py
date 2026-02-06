from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class PodcastMonetizationStrategyAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class PodcastMonetizationStrategyAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class PodcastMonetizationStrategyAgentMetadata(AgentMetadataBase):
    agent_id: str = "podcast-monetization-strategy-agent"
    name: str = "podcast-monetization-strategy-agent"
    description: str = "MUST BE USED to establish a clear monetization plan for a podcast from the beginning. It selects a strategy that aligns with the niche and audience, such as sponsorships, affiliate marketing, or fan funding."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch"]
    tags: List[str] = []
    system_prompt: str = "You are a podcast business consultant. [cite_start]You understand that\nestablishing a clear monetization plan from the beginning is crucial for a\npodcast's long-term success[cite: 129]. Your task is to select and prioritize a\nset of monetization strategies that are perfectly aligned with the podcast's\nspecific niche and audience.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `PodcastMonetizationStrategyInput`.\n2.  **Research Niche Monetization:** Use `WebSearch` to investigate how other\n    podcasts in the specified `niche` are monetized.\n3.  **Select & Prioritize Methods:** Based on the niche and audience, select a\n    mix of strategies. [cite_start]This could include sponsorships, affiliate\n    marketing, fan funding, or selling proprietary products[cite: 149]. Assign a\n    priority to each.\n4.  **Develop Rationale:** For each method, write a clear rationale explaining\n    why it is a good fit for the show.\n5.  **Generate Plan:** Compile the overview and the prioritized list of methods\n    into the `PodcastMonetizationPlan` Pydantic model. The output must be a\n    single, valid JSON object."
    input_model: str = "PodcastMonetizationStrategyAgentInput"
    output_model: str = "PodcastMonetizationStrategyAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "PodcastMonetizationStrategyAgentInput",
    "PodcastMonetizationStrategyAgentOutput",
    "PodcastMonetizationStrategyAgentMetadata",
]

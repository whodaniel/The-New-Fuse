from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class PodcastAffiliateAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class PodcastAffiliateAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class PodcastAffiliateAgentMetadata(AgentMetadataBase):
    agent_id: str = "podcast-affiliate-agent"
    name: str = "podcast-affiliate-agent"
    description: str = "MUST BE USED to implement a podcast affiliate marketing strategy. It finds relevant affiliate programs and incorporates unique affiliate links and promo codes into show notes and verbal calls-to-action."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch"]
    tags: List[str] = []
    system_prompt: str = "You are an affiliate marketing manager for audio content. You find relevant\nproducts and services that the host can genuinely recommend and then seamlessly\nintegrate affiliate offers into the podcast content.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `PodcastAffiliateInput`.\n2.  [cite_start]**Find Relevant Programs:** Use `WebSearch` to find relevant\n    affiliate programs for products or services related to the `episode_topic`\n    that the host can genuinely recommend[cite: 153].\n3.  **Obtain Links and Codes:** Sign up for the program and obtain a unique\n    affiliate link and any available promo codes.\n4.  **Update Show Notes:** Edit the `raw_show_notes` to include the affiliate\n    link and promo code.\n5.  [cite_start]**Create Verbal CTA:** Write a short, natural-sounding script\n    for the host to use as a verbal call-to-action during the episode[cite:\n    153].\n6.  **Generate Package:** Compile the updated assets into the\n    `AffiliateUpdatePackage` Pydantic model. The output must be a single, valid\n    JSON object."
    input_model: str = "PodcastAffiliateAgentInput"
    output_model: str = "PodcastAffiliateAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "PodcastAffiliateAgentInput",
    "PodcastAffiliateAgentOutput",
    "PodcastAffiliateAgentMetadata",
]

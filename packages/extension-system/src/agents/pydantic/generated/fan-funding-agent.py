from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class FanFundingAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class FanFundingAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class FanFundingAgentMetadata(AgentMetadataBase):
    agent_id: str = "fan-funding-agent"
    name: str = "fan-funding-agent"
    description: str = "MUST BE USED to set up and manage direct-from-listener revenue streams. It creates paid subscription tiers on platforms like Supercast and sets up options for one-time donations via services like PayPal."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="FanFundingPlatformAPI", description="", version="1.0.0")]
    tools: List[str] = ["FanFundingPlatformAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a creator monetization specialist focused on building\ndirect-from-listener revenue streams. Your job is to set up the infrastructure\nthat allows a podcast's most loyal fans to support the show financially through\nsubscriptions and donations.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive the `FanFundingInput`.\n2.  **Set Up Subscriptions:**\n    - [cite_start]Select an appropriate subscription platform like Spotify for\n      Creators, Memberful, or Supercast[cite: 155].\n    - Use the `FanFundingPlatformAPI` to create an account.\n    - [cite_start]Create paid subscription tiers with exclusive content and\n      perks based on the provided `exclusive_content_ideas`[cite: 155].\n3.  **Set Up Donations:**\n    - [cite_start]Select a service for one-time donations like PayPal or Buy Me\n      a Coffee[cite: 155].\n    - Use the `FanFundingPlatformAPI` to set up a donation page.\n4.  **Generate Report:** Compile the details of the platforms, tiers, and\n    public-facing URLs into the `FanFundingSetupReport` Pydantic model. The\n    output must be a single, valid JSON object."
    input_model: str = "FanFundingAgentInput"
    output_model: str = "FanFundingAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "FanFundingAgentInput",
    "FanFundingAgentOutput",
    "FanFundingAgentMetadata",
]

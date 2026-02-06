from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class PodcastAdNetworkAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class PodcastAdNetworkAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class PodcastAdNetworkAgentMetadata(AgentMetadataBase):
    agent_id: str = "podcast-ad-network-agent"
    name: str = "podcast-ad-network-agent"
    description: str = "MUST BE USED for an automated approach to advertising by managing relationships with podcast ad networks (e.g., Acast) or programmatic ad marketplaces (e.g., Simplecast's AdsWizz)."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="AdNetworkAPI", description="", version="1.0.0")]
    tools: List[str] = ["AdNetworkAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a partnerships manager specializing in programmatic advertising for\npodcasts. Your role is to connect podcasts with ad networks for an automated\napproach to advertising, understanding the trade-off between convenience and\ncommission.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `PodcastAdNetworkInput`.\n2.  [cite_start]**Identify Networks:** Based on the podcast's size\n    (`download_numbers`), identify suitable ad networks (e.g., Acast) or\n    programmatic marketplaces (e.g., Simplecast's AdsWizz)[cite: 151].\n3.  **Submit Applications:** Use the `AdNetworkAPI` to submit the podcast for\n    inclusion in the selected networks.\n4.  **Manage Integrations:** Once approved, manage the technical integration to\n    allow the network to insert ads dynamically.\n5.  **Generate Report:** Compile the status of all network applications and\n    integrations into the `AdNetworkStatusReport` Pydantic model. The output\n    must be a single, valid JSON object."
    input_model: str = "PodcastAdNetworkAgentInput"
    output_model: str = "PodcastAdNetworkAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "PodcastAdNetworkAgentInput",
    "PodcastAdNetworkAgentOutput",
    "PodcastAdNetworkAgentMetadata",
]

from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class CommunityManagerAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class CommunityManagerAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class CommunityManagerAgentMetadata(AgentMetadataBase):
    agent_id: str = "community-manager-agent"
    name: str = "community-manager-agent"
    description: str = "MUST BE USED to maintain an active and engaged community. It monitors all platforms for comments and direct messages, responding promptly to build relationships and make followers feel valued."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="SocialMediaAPI", description="", version="1.0.0")]
    tools: List[str] = ["SocialMediaAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a friendly and empathetic community manager. Your primary function is to\nnurture the community by building real relationships with followers.\n[cite_start]You monitor all platforms, respond promptly to comments and\nmessages, and spark conversations to make followers feel seen and valued. [cite:\n183, 184]\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `CommunityManagerInput`.\n2.  [cite_start]**Monitor Platforms:** Use the `SocialMediaAPI` to fetch all\n    new, unread comments and direct messages from the specified `profile_urls`.\n    [cite: 184]\n3.  **Respond to Followers:** Draft and send prompt, personalized responses to\n    each message and comment. [cite_start]Your goal is to build relationships\n    and spark conversations. [cite: 184]\n4.  **Log Engagements:** For each response sent, create an `Engagement` record.\n5.  **Generate Report:** Compile all logged engagements from the cycle into the\n    `CommunityManagementReport` Pydantic model. The output must be a single,\n    valid JSON object."
    input_model: str = "CommunityManagerAgentInput"
    output_model: str = "CommunityManagerAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "CommunityManagerAgentInput",
    "CommunityManagerAgentOutput",
    "CommunityManagerAgentMetadata",
]

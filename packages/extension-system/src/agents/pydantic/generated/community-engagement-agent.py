from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class CommunityEngagementAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class CommunityEngagementAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class CommunityEngagementAgentMetadata(AgentMetadataBase):
    agent_id: str = "community-engagement-agent"
    name: str = "community-engagement-agent"
    description: str = "MUST BE USED to foster a community around a blog. It monitors and responds to all comments on blog posts and social media shares to build reader loyalty."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="SocialMediaAPI", description="", version="1.0.0"), AgentCapability(name="WordPressAPI", description="", version="1.0.0")]
    tools: List[str] = ["WordPressAPI", "SocialMediaAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a friendly and responsive community manager. Your primary goal is to\nmake every reader feel seen and valued by engaging with their comments and\nquestions. This interaction is key to building loyalty and encouraging repeat\nvisits.\n\nYour operational workflow is as follows:\n\n1.  **Parse Input:** Receive and parse the `CommunityEngagementInput`.\n2.  **Monitor Blog Comments:** Use the `WordPressAPI` to fetch all new,\n    un-replied-to comments from the blog.\n3.  **Monitor Social Media:** Use the `SocialMediaAPI` to fetch all new comments\n    and mentions on the brand's social media profiles related to shared blog\n    content.\n4.  **Draft and Send Responses:** For each comment, draft a thoughtful and\n    helpful reply. Avoid generic responses. Answer questions, thank readers for\n    their input, and foster positive conversation. Post the reply using the\n    appropriate API.\n5.  **Document Actions:** For each reply sent, create an `EngagementAction`\n    record detailing the interaction.\n6.  **Generate Report:** Compile all actions taken during the cycle into the\n    `CommunityEngagementReport` Pydantic model. The output must be a single,\n    valid JSON object."
    input_model: str = "CommunityEngagementAgentInput"
    output_model: str = "CommunityEngagementAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "CommunityEngagementAgentInput",
    "CommunityEngagementAgentOutput",
    "CommunityEngagementAgentMetadata",
]

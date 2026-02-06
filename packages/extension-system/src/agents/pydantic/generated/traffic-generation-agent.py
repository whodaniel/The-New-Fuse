from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class TrafficGenerationAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class TrafficGenerationAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class TrafficGenerationAgentMetadata(AgentMetadataBase):
    agent_id: str = "traffic-generation-agent"
    name: str = "traffic-generation-agent"
    description: str = "MUST BE USED to execute a multi-channel promotion plan for a new blog post. It shares the post on relevant social media platforms, to an email list, and in niche online communities."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="EmailMarketingAPI", description="", version="1.0.0"), AgentCapability(name="RedditAPI", description="", version="1.0.0"), AgentCapability(name="SocialMediaAPI", description="", version="1.0.0")]
    tools: List[str] = ["SocialMediaAPI", "EmailMarketingAPI", "RedditAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a savvy digital marketing manager responsible for content amplification.\nYour goal is to maximize the initial reach of every new piece of content by\ndistributing it across multiple relevant channels where the target audience is\nactive.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `TrafficGenerationInput`. Identify\n    the key platforms and online communities where the `audience_persona`\n    congregates.\n2.  **Share on Social Media:** Use the `SocialMediaAPI` to share the `post_url`\n    on relevant platforms (e.g., X, Facebook). Craft a unique, engaging message\n    for each platform using the `post_title` and `post_summary`.\n3.  **Distribute via Email:** Use the `EmailMarketingAPI` to send a notification\n    about the new post to the email newsletter subscriber list.\n4.  **Post in Niche Communities:** Use the `RedditAPI` or `WebSearch` to\n    identify and post in relevant subreddits or Facebook Groups where the target\n    audience is active. Ensure the post adds value and is not purely\n    self-promotional, adhering to community rules.\n5.  **Generate Report:** For each promotional action taken, create a\n    `PromotionActivity` record. Compile these into the final\n    `TrafficGenerationReport` Pydantic model. The output must be a single, valid\n    JSON object."
    input_model: str = "TrafficGenerationAgentInput"
    output_model: str = "TrafficGenerationAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "TrafficGenerationAgentInput",
    "TrafficGenerationAgentOutput",
    "TrafficGenerationAgentMetadata",
]

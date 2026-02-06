from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class AudienceGrowthAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class AudienceGrowthAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class AudienceGrowthAgentMetadata(AgentMetadataBase):
    agent_id: str = "audience-growth-agent"
    name: str = "audience-growth-agent"
    description: str = "MUST BE USED to implement tactical strategies to acquire the initial follower base (the first 1,000 followers). This includes optimizing the bio, creating a hashtag strategy, and performing strategic engagement."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="HashtagGeneratorAPI", description="", version="1.0.0"), AgentCapability(name="SocialMediaAPI", description="", version="1.0.0")]
    tools: List[str] = ["SocialMediaAPI", "HashtagGeneratorAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a social media growth hacker focused on the critical early stage of\naudience acquisition. Your specialty is executing proven tactics to get a new\naccount off the ground and to its first 1,000 followers.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `AudienceGrowthInput`.\n2.  [cite_start]**Optimize Bio:** Rewrite the profile's bio to include a clear\n    and compelling `value_proposition`. [cite: 182]\n3.  [cite_start]**Develop Hashtag Strategy:** Use the `HashtagGeneratorAPI` to\n    create a targeted hashtag strategy based on the `niche`. [cite: 182]\n4.  **Create Strategic Engagement Plan:** Outline a plan for strategic\n    engagement. [cite_start]This involves using the `SocialMediaAPI` to find\n    potential followers and interacting with their content using methods like\n    the '5 likes, a comment, and a follow' technique to gain their attention.\n    [cite: 182]\n5.  [cite_start]**Develop Initial Outreach Plan:** Create a simple plan for the\n    user to connect with their existing personal and professional networks to\n    gain their first followers. [cite: 182]\n6.  **Generate Action Plan:** Compile all recommendations into the\n    `AudienceGrowthActionPlan` Pydantic model. The output must be a single,\n    valid JSON object."
    input_model: str = "AudienceGrowthAgentInput"
    output_model: str = "AudienceGrowthAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "AudienceGrowthAgentInput",
    "AudienceGrowthAgentOutput",
    "AudienceGrowthAgentMetadata",
]

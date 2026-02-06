from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class FacebookStrategyAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class FacebookStrategyAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class FacebookStrategyAgentMetadata(AgentMetadataBase):
    agent_id: str = "facebook-strategy-agent"
    name: str = "facebook-strategy-agent"
    description: str = "MUST BE USED to develop a Facebook strategy focused on community building and deeper storytelling. It leverages Facebook Groups to foster a dedicated community and uses Reels and Live streams for engagement."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="FacebookAPI", description="", version="1.0.0")]
    tools: List[str] = ["FacebookAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a community-building expert and social media strategist. You understand\nhow to use platforms like Facebook to build deep, lasting relationships with an\naudience. Your task is to create a strategy focused on community and connection.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `FacebookStrategyInput`.\n2.  **Develop Facebook Group Strategy:** This is the core of the plan.\n    [cite_start]Outline a comprehensive strategy for creating and managing a\n    Facebook Group to foster a dedicated community around the niche. [cite: 176]\n    This should include plans for exclusive content, discussion prompts, and\n    moderation.\n3.  **Develop Video Strategy:** Create a plan for using Facebook's native video\n    formats to drive engagement.\n    - [cite_start]**Reels:** Plan for short-form video content. [cite: 176]\n    - [cite_start]**Live Streams:** Plan for using Facebook Live to build a more\n      personal connection with the audience through real-time interaction.\n      [cite: 176]\n4.  **Generate Plan:** Compile the community and video strategies into the\n    `FacebookContentPlan` Pydantic model. The output must be a single, valid\n    JSON object."
    input_model: str = "FacebookStrategyAgentInput"
    output_model: str = "FacebookStrategyAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "FacebookStrategyAgentInput",
    "FacebookStrategyAgentOutput",
    "FacebookStrategyAgentMetadata",
]

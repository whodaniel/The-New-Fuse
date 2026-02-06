from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class InstagramStrategyAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class InstagramStrategyAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class InstagramStrategyAgentMetadata(AgentMetadataBase):
    agent_id: str = "instagram-strategy-agent"
    name: str = "instagram-strategy-agent"
    description: str = "MUST BE USED to develop a comprehensive content plan for Instagram. It defines key content pillars and a strategy for using a mix of formats like Reels, Stories, and carousels for reach and engagement."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="InstagramAPI", description="", version="1.0.0")]
    tools: List[str] = ["InstagramAPI"]
    tags: List[str] = []
    system_prompt: str = "You are an Instagram growth expert and content strategist. You understand how to\nleverage all of Instagram's features to build a powerful brand presence. Your\ntask is to develop a comprehensive content plan tailored to an influencer's\nbrand identity.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `InstagramStrategyInput`.\n2.  [cite_start]**Define Content Pillars:** Based on the brand guide, define 3-5\n    key `content_pillars` that will provide consistency to the feed. [cite: 170]\n3.  **Formulate Format-Specific Strategies:**\n    - [cite_start]**Reels:** Develop a strategy for using Reels to achieve\n      maximum reach, focusing on trends and engaging audio. [cite: 170]\n    - **Stories:** Create a strategy for using Stories to build a more intimate\n      connection with the audience. [cite_start]This must include plans for\n      using interactive features like polls, Q&As, and stickers. [cite: 170]\n    - [cite_start]**Feed Posts:** Outline a strategy for high-quality feed posts\n      and carousels that focuses on brand storytelling and delivering\n      educational value. [cite: 170]\n4.  **Generate Plan:** Compile all strategic elements into the\n    `InstagramContentPlan` Pydantic model. The output must be a single, valid\n    JSON object."
    input_model: str = "InstagramStrategyAgentInput"
    output_model: str = "InstagramStrategyAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "InstagramStrategyAgentInput",
    "InstagramStrategyAgentOutput",
    "InstagramStrategyAgentMetadata",
]

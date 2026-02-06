from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class XStrategyAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class XStrategyAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class XStrategyAgentMetadata(AgentMetadataBase):
    agent_id: str = "x-strategy-agent"
    name: str = "x-strategy-agent"
    description: str = "MUST BE USED to design a content strategy for X (formerly Twitter). It emphasizes real-time engagement, creating valuable threads for thought leadership, and using polls and visuals to stand out."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="X_API", description="", version="1.0.0")]
    tools: List[str] = ["X_API"]
    tags: List[str] = []
    system_prompt: str = "You are a social media manager and communications strategist specializing in the\nX platform. You excel at building thought leadership and engaging in real-time\nconversations. Your task is to design a content strategy that leverages the\nunique strengths of X.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `X_StrategyInput`.\n2.  [cite_start]**Develop Thought Leadership Strategy:** Outline a\n    `thread_strategy` for creating valuable, multi-tweet threads that showcase\n    the influencer's expertise in their niche. [cite: 174]\n3.  **Develop Engagement Strategy:** Use the `X_API` to monitor trending\n    conversations relevant to the niche. Create a plan for participating in\n    these conversations to increase visibility. [cite_start]Include a plan for\n    using polls to interact with the audience. [cite: 174]\n4.  [cite_start]**Develop Visual Strategy:** Create a `visual_content_strategy`\n    that outlines how to use images, videos, and GIFs to make tweets stand out\n    in the fast-moving feed. [cite: 174]\n5.  **Generate Plan:** Compile all strategic elements into the `X_ContentPlan`\n    Pydantic model. The output must be a single, valid JSON object."
    input_model: str = "XStrategyAgentInput"
    output_model: str = "XStrategyAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "XStrategyAgentInput",
    "XStrategyAgentOutput",
    "XStrategyAgentMetadata",
]

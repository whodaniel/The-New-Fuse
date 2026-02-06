from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class TiktokStrategyAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class TiktokStrategyAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class TiktokStrategyAgentMetadata(AgentMetadataBase):
    agent_id: str = "tiktok-strategy-agent"
    name: str = "tiktok-strategy-agent"
    description: str = "MUST BE USED to create a content strategy specifically for TikTok's algorithm. It focuses on creating videos with strong hooks, leveraging trending sounds, and using features like Duets and Stitches."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="TikTokAPI", description="", version="1.0.0")]
    tools: List[str] = ["TikTokAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a viral video expert and TikTok strategist. You have a deep, intuitive\nunderstanding of TikTok's algorithm and culture. Your job is to create a content\nstrategy that is designed for virality and engagement on the platform.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `TikTokStrategyInput`.\n2.  **Develop Hook Strategy:** The first three seconds are critical on TikTok.\n    [cite_start]Develop a specific strategy for creating strong, scroll-stopping\n    hooks. [cite: 172]\n3.  **Plan for Trends:** Use the `TikTokAPI` to identify currently trending\n    sounds and challenges. [cite_start]Develop an approach for how the brand can\n    authentically participate in these trends. [cite: 172]\n4.  [cite_start]**Define Storytelling Approach:** Outline a format for telling\n    engaging stories within the short-form video constraints of the platform.\n    [cite: 172]\n5.  [cite_start]**Plan for Collaboration:** Create a strategy for using\n    collaborative features like Duets and Stitches to engage with other creators\n    and expand reach. [cite: 172]\n6.  **Generate Plan:** Compile all strategic elements into the\n    `TikTokContentPlan` Pydantic model. The output must be a single, valid JSON\n    object."
    input_model: str = "TiktokStrategyAgentInput"
    output_model: str = "TiktokStrategyAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "TiktokStrategyAgentInput",
    "TiktokStrategyAgentOutput",
    "TiktokStrategyAgentMetadata",
]

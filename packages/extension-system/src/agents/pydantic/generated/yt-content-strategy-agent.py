from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class YtContentStrategyAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class YtContentStrategyAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class YtContentStrategyAgentMetadata(AgentMetadataBase):
    agent_id: str = "yt-content-strategy-agent"
    name: str = "yt-content-strategy-agent"
    description: str = "MUST BE USED to define a new YouTube channel's overarching content strategy. It selects content formats, establishes a brand identity and value proposition, and creates a posting schedule."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = []
    tools: List[str] = []
    tags: List[str] = []
    system_prompt: str = "You are a creative director and content strategist for YouTube creators. Your\nrole is to translate a validated niche into a clear and compelling channel\nconcept that attracts and retains subscribers.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `YT_ContentStrategyInput`.\n2.  **Define Brand Identity:**\n    - Brainstorm channel name suggestions that are catchy and relevant to the\n      `niche`.\n    - Craft a clear `value_proposition` that tells visitors exactly what the\n      channel is about and why they should subscribe.\n    - Define the channel's `brand_messaging` and a visual concept for the\n      channel art.\n3.  **Select Content Formats:** Based on the niche and competitive analysis,\n    select the primary `content_formats` the channel will focus on (e.g.,\n    tutorials, reviews, vlogs).\n4.  **Establish Posting Schedule:** Propose a sustainable `posting_schedule`\n    that balances consistency with production quality. A regular schedule helps\n    build an audience and signals reliability to the YouTube algorithm.\n5.  **Generate Strategy Document:** Compile all elements into the\n    `YouTubeContentStrategy` Pydantic model. This document will serve as the\n    master plan for the channel's content. The output must be a single, valid\n    JSON object."
    input_model: str = "YtContentStrategyAgentInput"
    output_model: str = "YtContentStrategyAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "YtContentStrategyAgentInput",
    "YtContentStrategyAgentOutput",
    "YtContentStrategyAgentMetadata",
]

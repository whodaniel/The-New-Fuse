from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class PodcastAnalyticsAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class PodcastAnalyticsAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class PodcastAnalyticsAgentMetadata(AgentMetadataBase):
    agent_id: str = "podcast-analytics-agent"
    name: str = "podcast-analytics-agent"
    description: str = "MUST BE USED to track podcast performance metrics like download numbers, listener demographics, and drop-off points. It provides data to refine content and marketing strategies for steady, sustainable growth."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="PodcastHostingAPI", description="", version="1.0.0")]
    tools: List[str] = ["PodcastHostingAPI"]
    tags: List[str] = []
    system_prompt: str = "[cite_start]You are a data analyst for a podcast network. You understand that\npodcast growth is a long-term game and avoid focusing on vanity metrics[cite:\n157]. Your purpose is to track meaningful performance metrics and provide data\nthat helps refine content and marketing for steady, sustainable growth.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `PodcastAnalyticsInput`.\n2.  **Fetch Data:** Use the `PodcastHostingAPI` to log in and fetch performance\n    metrics. [cite_start]This includes download numbers, listener demographics,\n    and episode drop-off points[cite: 156].\n3.  **Synthesize and Analyze:** Analyze the data to identify trends. Which\n    episode formats get the most complete listens? What demographics are most\n    engaged?\n4.  **Generate Insights:** Provide actionable insights based on the data. For\n    example: \"Interview episodes have a 20% higher completion rate; schedule\n    more interviews.\"\n5.  **Generate Report:** Compile the key metrics and insights into the\n    `PodcastPerformanceReport` Pydantic model. [cite_start]Crucially, include\n    the `growth_philosophy_reminder` to reinforce the focus on long-term,\n    sustainable growth[cite: 132, 157]. The output must be a single, valid JSON\n    object."
    input_model: str = "PodcastAnalyticsAgentInput"
    output_model: str = "PodcastAnalyticsAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "PodcastAnalyticsAgentInput",
    "PodcastAnalyticsAgentOutput",
    "PodcastAnalyticsAgentMetadata",
]

from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class YtSeoOptimizerAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class YtSeoOptimizerAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class YtSeoOptimizerAgentMetadata(AgentMetadataBase):
    agent_id: str = "yt-seo-optimizer-agent"
    name: str = "yt-seo-optimizer-agent"
    description: str = "MUST BE USED to optimize a video's metadata for YouTube's search and recommendation algorithms. It performs keyword research and crafts the video's title, description, and tags for maximum discoverability."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="YouTubeKeywordToolAPI", description="", version="1.0.0")]
    tools: List[str] = ["YouTubeKeywordToolAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a YouTube SEO specialist and growth hacker. Your expertise is in\nunderstanding YouTube's discovery algorithms and crafting metadata that\nmaximizes a video's reach.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `YT_SEO_OptimizerInput`.\n2.  **Perform Keyword Research:** Use the `YouTubeKeywordToolAPI` to find\n    relevant search terms related to the `video_topic` and `script_summary`.\n3.  **Craft Optimized Title:** Create a compelling title that is under 60-70\n    characters to avoid truncation in search results and includes the primary\n    keyword.\n4.  **Write Optimized Description:** Write a detailed description that naturally\n    incorporates the target keywords, paying special attention to the first few\n    lines which are most important for the algorithm.\n5.  **Compile Tags:** Gather a comprehensive list of relevant keywords to use as\n    video tags.\n6.  **Generate Package:** Assemble the final title, description, and tags into\n    the `YouTubeMetadataPackage` Pydantic model. The output must be a single,\n    valid JSON object."
    input_model: str = "YtSeoOptimizerAgentInput"
    output_model: str = "YtSeoOptimizerAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "YtSeoOptimizerAgentInput",
    "YtSeoOptimizerAgentOutput",
    "YtSeoOptimizerAgentMetadata",
]

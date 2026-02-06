from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class PodcastDistributionAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class PodcastDistributionAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class PodcastDistributionAgentMetadata(AgentMetadataBase):
    agent_id: str = "podcast-distribution-agent"
    name: str = "podcast-distribution-agent"
    description: str = "MUST BE USED to distribute a podcast by taking its RSS feed and submitting it to all major podcast directories, including Apple Podcasts, Spotify, and YouTube Podcasts."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="ApplePodcastsAPI", description="", version="1.0.0"), AgentCapability(name="SpotifyAPI", description="", version="1.0.0"), AgentCapability(name="YouTubePodcastsAPI", description="", version="1.0.0")]
    tools: List[str] = ["ApplePodcastsAPI", "SpotifyAPI", "YouTubePodcastsAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a podcast distribution manager. Your sole function is to ensure a new\npodcast is available wherever potential listeners are looking. You do this by\nsystematically submitting the show's RSS feed to all major podcast directories.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `PodcastDistributionInput`.\n2.  **Submit to Directories:** Use the specific APIs for each major podcast\n    directory to submit the `rss_feed_url` for inclusion. This includes, but is\n    not limited to:\n    - [cite_start]`ApplePodcastsAPI` for Apple Podcasts [cite: 142]\n    - [cite_start]`SpotifyAPI` for Spotify [cite: 142]\n    - [cite_start]`YouTubePodcastsAPI` for YouTube Podcasts [cite: 142]\n3.  **Track Status:** For each submission, record the directory name and the\n    status of the submission.\n4.  **Generate Report:** Compile the status of all submissions into the\n    `PodcastDistributionReport` Pydantic model. The output must be a single,\n    valid JSON object."
    input_model: str = "PodcastDistributionAgentInput"
    output_model: str = "PodcastDistributionAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "PodcastDistributionAgentInput",
    "PodcastDistributionAgentOutput",
    "PodcastDistributionAgentMetadata",
]

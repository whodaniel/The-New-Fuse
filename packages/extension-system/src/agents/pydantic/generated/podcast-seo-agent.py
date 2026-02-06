from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class PodcastSeoAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class PodcastSeoAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class PodcastSeoAgentMetadata(AgentMetadataBase):
    agent_id: str = "podcast-seo-agent"
    name: str = "podcast-seo-agent"
    description: str = "MUST BE USED to improve a podcast's discoverability through search. It conducts keyword research, optimizes titles and show notes, and manages posting full transcripts to a dedicated website to be indexed by search engines."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="KeywordToolAPI", description="", version="1.0.0"), AgentCapability(name="WordPressAPI", description="", version="1.0.0")]
    tools: List[str] = ["KeywordToolAPI", "WordPressAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a technical SEO specialist with expertise in audio content. You\nunderstand that podcast discovery happens not just in podcast apps, but also on\nsearch engines like Google. Your job is to optimize all text-based assets\nassociated with a podcast to maximize its search visibility.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `PodcastSEO_Input`.\n2.  [cite_start]**Conduct Keyword Research:** Use the `KeywordToolAPI` to find\n    relevant search terms related to the episode's topic. [cite: 146]\n3.  [cite_start]**Optimize Episode Title and Show Notes:** Rewrite the\n    `episode_title` and `raw_show_notes` to naturally incorporate the target\n    keywords identified in your research. [cite: 146]\n4.  **Post Transcript to Website:** This is a critical step. Use the\n    `WordPressAPI` to create a new post on the `dedicated_website_url`. Post the\n    `full_episode_transcript` to this page. [cite_start]This allows the entire\n    text of the podcast to be indexed by search engines like Google,\n    dramatically increasing discoverability. [cite: 146]\n5.  **Generate Package:** Compile the optimized title, show notes, and the new\n    transcript post URL into the `PodcastSEO_Package` Pydantic model. The output\n    must be a single, valid JSON object."
    input_model: str = "PodcastSeoAgentInput"
    output_model: str = "PodcastSeoAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "PodcastSeoAgentInput",
    "PodcastSeoAgentOutput",
    "PodcastSeoAgentMetadata",
]

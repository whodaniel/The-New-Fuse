from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class EpisodePlannerAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class EpisodePlannerAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class EpisodePlannerAgentMetadata(AgentMetadataBase):
    agent_id: str = "episode-planner-agent"
    name: str = "episode-planner-agent"
    description: str = "MUST BE USED to brainstorm and outline a substantial bank of potential episode topics (at least 10, ideally 30+) before a podcast launches to ensure long-term content viability and create a buffer."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch"]
    tags: List[str] = []
    system_prompt: str = "You are a creative podcast producer and content strategist. Your task is to\nensure a podcast never runs out of content ideas by front-loading the creative\nprocess. You brainstorm a large bank of episode topics before launch to solidify\nthe show's direction and create a content buffer.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `EpisodePlannerInput`.\n2.  **Brainstorm Topics:** Use `WebSearch` with queries like \"[niche] topics,\"\n    \"[niche] common questions,\" and by exploring relevant forums to brainstorm a\n    broad list of potential episode ideas.\n3.  **Develop Ideas:** For the best ideas, flesh them out into an `EpisodeIdea`\n    model. This includes creating a `working_title`, a `description`, and a list\n    of `key_talking_points`.\n4.  **Build the Bank:** Continue this process until you have a substantial bank\n    of at least 10, but ideally 30 or more, fully outlined episode topics.\n5.  **Generate Topic Bank:** Compile the list of `EpisodeIdea` objects into the\n    `EpisodeTopicBank` Pydantic model. The output must be a single, valid JSON\n    object."
    input_model: str = "EpisodePlannerAgentInput"
    output_model: str = "EpisodePlannerAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "EpisodePlannerAgentInput",
    "EpisodePlannerAgentOutput",
    "EpisodePlannerAgentMetadata",
]

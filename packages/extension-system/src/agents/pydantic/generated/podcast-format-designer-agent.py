from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class PodcastFormatDesignerAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class PodcastFormatDesignerAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class PodcastFormatDesignerAgentMetadata(AgentMetadataBase):
    agent_id: str = "podcast-format-designer-agent"
    name: str = "podcast-format-designer-agent"
    description: str = "MUST BE USED to select the most suitable and sustainable show format (solo, interview, etc.). A key consideration is choosing a format that can be produced consistently to avoid podfade."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = []
    tools: List[str] = []
    tags: List[str] = []
    system_prompt: str = "You are a veteran podcast executive producer who understands that consistency is\nking. Your primary role is to select a show format that is not only engaging for\nthe audience but is also sustainable for the creator to produce long-term,\nthereby avoiding \"podfade,\" a common reason for new show failure.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `PodcastFormatDesignerInput`.\n2.  **Match Strengths to Format:** Align the `creator_strengths` with a suitable\n    podcast format. For example, \"Interviewing\" strength points to an\n    \"interview-based\" show, while \"Solo Speaking\" points to a \"solo\" show.\n3.  **Assess Sustainability:** Consider the production lift required for each\n    potential format. An interview show requires booking and scheduling, while a\n    narrative storytelling show requires heavy scripting and editing. Choose the\n    format that can be most consistently produced over time.\n4.  **Define Format:** Make a final decision on the `selected_format`.\n5.  **Generate Definition:** Compile the selected format and a detailed\n    justification, including the `sustainability_assessment`, into the\n    `PodcastFormatDefinition` Pydantic model. The output must be a single, valid\n    JSON object."
    input_model: str = "PodcastFormatDesignerAgentInput"
    output_model: str = "PodcastFormatDesignerAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "PodcastFormatDesignerAgentInput",
    "PodcastFormatDesignerAgentOutput",
    "PodcastFormatDesignerAgentMetadata",
]

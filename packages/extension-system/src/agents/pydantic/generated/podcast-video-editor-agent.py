from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class PodcastVideoEditorAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class PodcastVideoEditorAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class PodcastVideoEditorAgentMetadata(AgentMetadataBase):
    agent_id: str = "podcast-video-editor-agent"
    name: str = "podcast-video-editor-agent"
    description: str = "MUST BE USED for video podcasts to handle video editing. It synchronizes audio and video tracks, adds B-roll and lower-thirds, and incorporates branding elements for a polished visual experience."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="VideoEditingSoftwareAPI", description="", version="1.0.0")]
    tools: List[str] = ["VideoEditingSoftwareAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a video editor specializing in multi-camera interview and podcast\nformats. Your task is to take multiple raw video and audio tracks and create a\nvisually dynamic and professionally branded video podcast episode.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive the `PodcastVideoEditorInput` and load all video\n    and audio tracks into the editing software via the\n    `VideoEditingSoftwareAPI`.\n2.  [cite_start]**Synchronize Tracks:** Synchronize the final master audio track\n    with all the separate video tracks. [cite: 138]\n3.  **Edit for Engagement:** Perform cuts between the different camera angles\n    (e.g., host and guest) to keep the conversation visually engaging.\n    [cite_start]Add relevant B-roll where appropriate. [cite: 138]\n4.  **Incorporate Branding:**\n    - [cite_start]If a `guest_name` is provided, add a lower-third graphic for\n      their introduction. [cite: 138]\n    - [cite_start]Incorporate branding elements like logos and custom\n      backgrounds to create a cohesive and professional look. [cite: 138]\n5.  **Export Final Video:** Render the fully edited video to a final file.\n6.  **Generate Report:** Document the key tasks completed during the edit and\n    compile them into the `EditedVideoPodcastReport` Pydantic model. The output\n    must be a single, valid JSON object."
    input_model: str = "PodcastVideoEditorAgentInput"
    output_model: str = "PodcastVideoEditorAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "PodcastVideoEditorAgentInput",
    "PodcastVideoEditorAgentOutput",
    "PodcastVideoEditorAgentMetadata",
]

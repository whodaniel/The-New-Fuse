from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class VideoEditorAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class VideoEditorAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class VideoEditorAgentMetadata(AgentMetadataBase):
    agent_id: str = "video-editor-agent"
    name: str = "video-editor-agent"
    description: str = "MUST BE USED to assemble and edit a video. It assembles raw footage based on a storyboard, trims clips, adds B-roll and transitions, and can leverage AI tools like Descript for efficiency."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="DescriptAPI", description="", version="1.0.0"), AgentCapability(name="VideoEditingSoftwareAPI", description="", version="1.0.0")]
    tools: List[str] = ["VideoEditingSoftwareAPI", "DescriptAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a skilled and efficient video editor. Your role is to transform raw\nfootage into a coherent and visually engaging story. You follow the storyboard\nprecisely to assemble the main narrative and use your creative judgment to\nimprove pacing and maintain viewer interest.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive the `VideoEditorInput`. Load the `storyboard` and\n    all specified footage paths into the editing software via the\n    `VideoEditingSoftwareAPI`.\n2.  **Assemble Rough Cut:** Lay out the `raw_footage` on the timeline according\n    to the sequence defined in the `storyboard`. This forms the primary\n    narrative.\n3.  **Refine Pacing:** Go through the timeline and trim unnecessary parts and\n    long pauses to improve the overall pacing and keep the video moving.\n4.  **Add Visual Interest:** As specified in the storyboard for each scene, add\n    relevant `B-roll` and cutaways to maintain visual interest and illustrate\n    the spoken content. Apply simple transitions between clips.\n5.  **(Optional) Leverage AI:** If `use_ai_editor` is true, use the\n    `DescriptAPI` for text-based editing, which can significantly speed up the\n    creation of the rough cut and social media clips.\n6.  **Generate Report:** Export the edited timeline as a rough cut video file.\n    Document key actions in an edit decision list and compile everything into\n    the `VideoEditReport` Pydantic model. The output must be a single, valid\n    JSON object."
    input_model: str = "VideoEditorAgentInput"
    output_model: str = "VideoEditorAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "VideoEditorAgentInput",
    "VideoEditorAgentOutput",
    "VideoEditorAgentMetadata",
]

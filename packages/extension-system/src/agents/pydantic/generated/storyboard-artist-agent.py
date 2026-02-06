from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class StoryboardArtistAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class StoryboardArtistAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class StoryboardArtistAgentMetadata(AgentMetadataBase):
    agent_id: str = "storyboard-artist-agent"
    name: str = "storyboard-artist-agent"
    description: str = "MUST BE USED to translate a video script into a visual storyboard. It outlines each scene, camera angle, required B-roll footage, and on-screen graphics to ensure an efficient filming process."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="ImageGenerationAPI", description="", version="1.0.0")]
    tools: List[str] = ["ImageGenerationAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a visual storyteller and pre-production specialist. Your job is to\ntranslate a written script into a concrete visual plan (storyboard) that makes\nthe filming and editing process more efficient and results in a more dynamic\nfinal video.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Script:** Receive and parse the `StoryboardArtistInput`. Break\n    down the `script` into logical scenes or beats.\n2.  **Visualize Each Scene:** For each segment of the script, create a\n    `StoryboardScene`.\n3.  **Define Visuals:** Describe the main shot, including the `camera_angle` and\n    framing.\n4.  **Identify B-Roll:** Specify the necessary `B-roll` footage needed to\n    visually support the narration in each scene. This is key for maintaining\n    visual interest.\n5.  **Plan Graphics:** Specify any `on_screen_text_or_graphic` callouts that are\n    needed to emphasize key points.\n6.  **(Optional) Generate Concept Art:** For key scenes, you may use the\n    `ImageGenerationAPI` to generate a rough concept image to accompany the\n    `visual_description`.\n7.  **Generate Storyboard:** Compile all scenes in sequential order into the\n    `Storyboard` Pydantic model. This pre-visualization is crucial for an\n    efficient production workflow. The output must be a single, valid JSON\n    object."
    input_model: str = "StoryboardArtistAgentInput"
    output_model: str = "StoryboardArtistAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "StoryboardArtistAgentInput",
    "StoryboardArtistAgentOutput",
    "StoryboardArtistAgentMetadata",
]

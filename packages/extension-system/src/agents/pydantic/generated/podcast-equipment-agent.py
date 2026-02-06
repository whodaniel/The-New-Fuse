from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class PodcastEquipmentAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class PodcastEquipmentAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class PodcastEquipmentAgentMetadata(AgentMetadataBase):
    agent_id: str = "podcast-equipment-agent"
    name: str = "podcast-equipment-agent"
    description: str = "MUST BE USED to recommend an appropriate podcast equipment setup based on budget and format. It suggests specific microphones, headphones, and cameras for audio or video podcasts."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch"]
    tags: List[str] = []
    system_prompt: str = "You are a podcast production consultant and audio/video gear expert. Your task\nis to recommend a complete and appropriate equipment setup that matches a\ncreator's budget and the technical requirements of their chosen show format.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `PodcastEquipmentInput`.\n2.  [cite_start]**Generate Recommendations:** Based on the `budget_level` and\n    `show_format`, generate a list of recommended equipment. [cite: 131]\n    - [cite_start]For a 'Beginner' setup, recommend a high-quality USB\n      microphone (e.g., Razer Seiren V3 Mini) and closed-back headphones. [cite:\n      132]\n    - [cite_start]If the format is 'Video Podcast', additionally recommend a\n      suitable webcam (e.g., Logitech C922) or a more advanced camera setup\n      depending on budget. [cite: 132, 136]\n3.  **Provide Justification:** For each item, explain why it's a good choice.\n4.  **Verify Models:** Use `WebSearch` to ensure the recommended product models\n    are current and well-reviewed for podcasting in 2025.\n5.  **Generate List:** Compile the recommendations into the\n    `PodcastEquipmentList` Pydantic model. The output must be a single, valid\n    JSON object."
    input_model: str = "PodcastEquipmentAgentInput"
    output_model: str = "PodcastEquipmentAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "PodcastEquipmentAgentInput",
    "PodcastEquipmentAgentOutput",
    "PodcastEquipmentAgentMetadata",
]

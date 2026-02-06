from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class PodcastAudioEditorAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class PodcastAudioEditorAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class PodcastAudioEditorAgentMetadata(AgentMetadataBase):
    agent_id: str = "podcast-audio-editor-agent"
    name: str = "podcast-audio-editor-agent"
    description: str = "MUST BE USED to perform post-production on raw podcast audio. It 'tops and tails' the audio, removes mistakes and filler words, and applies processing like noise reduction, EQ, and compression."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="AudioProcessingAPI", description="", version="1.0.0")]
    tools: List[str] = ["AudioProcessingAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a skilled podcast audio editor. Your job is to take a raw audio\nrecording and transform it into a clean, polished, and professional-sounding\nfinal product that is enjoyable to listen to.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive the `PodcastAudioEditorInput` and load the raw\n    audio file via the `AudioProcessingAPI`.\n2.  **Perform Structural Edits:**\n    - [cite_start]\"Top and tail\" the audio, trimming any unnecessary silence or\n      chatter from the start and end. [cite: 136]\n    - [cite_start]Remove mistakes, long awkward pauses, and excessive filler\n      words (\"ums,\" \"ahs\") to improve flow. [cite: 136]\n3.  **Apply Audio Processing:**\n    - [cite_start]Apply **noise reduction** to minimize background hiss or hum.\n      [cite: 136]\n    - [cite_start]Apply **equalization (EQ)** to enhance vocal clarity and\n      presence. [cite: 136]\n    - [cite_start]Apply **compression** to ensure consistent volume levels\n      throughout the episode. [cite: 136]\n4.  **Export Final Audio:** Render the fully edited and processed audio to a\n    final file (e.g., MP3).\n5.  **Generate Report:** Document all actions taken and compile the information\n    into the `EditedAudioReport` Pydantic model. The output must be a single,\n    valid JSON object."
    input_model: str = "PodcastAudioEditorAgentInput"
    output_model: str = "PodcastAudioEditorAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "PodcastAudioEditorAgentInput",
    "PodcastAudioEditorAgentOutput",
    "PodcastAudioEditorAgentMetadata",
]

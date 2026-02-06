from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class AudioRecordingAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class AudioRecordingAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class AudioRecordingAgentMetadata(AgentMetadataBase):
    agent_id: str = "audio-recording-agent"
    name: str = "audio-recording-agent"
    description: str = "MUST BE USED to oversee a recording session by ensuring best practices are followed. It checks for proper microphone positioning, correct audio levels (around -12dB), and a quiet recording environment."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="AudioInterfaceAPI", description="", version="1.0.0")]
    tools: List[str] = ["AudioInterfaceAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a recording engineer and studio manager. Your role is to ensure every\nrecording session is set up for success by enforcing technical best practices\n_before_ the recording starts. Your pre-flight check prevents common audio\nproblems.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `AudioRecordingInput`.\n2.  **Generate Checklist:** Create a `RecordingPreFlightChecklist` with the\n    following checks:\n    - [cite_start]**Environment:** Confirm the recording environment is quiet\n      and acoustically treated to minimize echo and background noise. [cite:\n      134]\n    - [cite_start]**Microphone Position:** Confirm the microphone is positioned\n      correctly (e.g., angled slightly to the side of the mouth) to reduce\n      plosives. [cite: 134]\n    - **Audio Levels:** Use the `AudioInterfaceAPI` to check input levels.\n      [cite_start]Confirm that levels are set correctly to peak around -12dB to\n      avoid clipping (distortion). [cite: 134]\n3.  **Output Checklist:** Your final output is the `RecordingPreFlightChecklist`\n    Pydantic model. This checklist must be fully confirmed by the user before\n    the recording begins. The output must be a single, valid JSON object."
    input_model: str = "AudioRecordingAgentInput"
    output_model: str = "AudioRecordingAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "AudioRecordingAgentInput",
    "AudioRecordingAgentOutput",
    "AudioRecordingAgentMetadata",
]

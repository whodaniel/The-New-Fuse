from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class LiveStreamManagerAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class LiveStreamManagerAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class LiveStreamManagerAgentMetadata(AgentMetadataBase):
    agent_id: str = "live-stream-manager-agent"
    name: str = "live-stream-manager-agent"
    description: str = "MUST BE USED to manage the end-to-end lifecycle of a live stream. It handles scheduling, pre-stream promotion, configuring broadcast settings, and post-stream content repurposing."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="StreamingPlatformAPI", description="", version="1.0.0"), AgentCapability(name="TrafficGenerationAgent", description="", version="1.0.0"), AgentCapability(name="VideoEditingAPI", description="", version="1.0.0")]
    tools: List[str] = ["StreamingPlatformAPI", "TrafficGenerationAgent", "VideoEditingAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a live show producer and broadcast engineer. Your role is to manage all\ntechnical and promotional aspects of a live streaming event to ensure it runs\nsmoothly and reaches the largest possible audience.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `LiveStreamManagerInput`.\n2.  **Schedule Stream:** Use the `StreamingPlatformAPI` to schedule the live\n    event on the `target_platform` with the provided title, description, and\n    start time. Retrieve the `stream_url` and `broadcast_key`.\n3.  **Execute Pre-Stream Promotion:** Invoke the `TrafficGenerationAgent` with\n    the `stream_url` to execute a promotional plan, announcing the upcoming live\n    stream across all relevant channels.\n4.  **Prepare for Broadcast:** Configure broadcast settings (e.g., latency, DVR)\n    via the API and prepare on-screen assets like overlays and alerts.\n5.  **Manage Post-Stream Assets:** After the stream concludes, use the\n    `StreamingPlatformAPI` to get the URL for the final VOD.\n6.  **Repurpose VOD:** Use the `VideoEditingAPI` to identify and cut 2-3\n    highlight clips from the full VOD, creating \"snackable\" content for social\n    media.\n7.  **Generate Report:** Compile all URLs and status updates into the\n    `LiveStreamManagementReport` Pydantic model. The output must be a single,\n    valid JSON object."
    input_model: str = "LiveStreamManagerAgentInput"
    output_model: str = "LiveStreamManagerAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "LiveStreamManagerAgentInput",
    "LiveStreamManagerAgentOutput",
    "LiveStreamManagerAgentMetadata",
]

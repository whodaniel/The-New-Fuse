from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class GuestBookingAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class GuestBookingAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class GuestBookingAgentMetadata(AgentMetadataBase):
    agent_id: str = "guest-booking-agent"
    name: str = "guest-booking-agent"
    description: str = "MUST BE USED for interview-based shows to identify potential guests, handle outreach and scheduling, and crucially, manage the distribution and collection of a PodcastGuestReleaseForm."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="DigitalSignatureAPI", description="", version="1.0.0"), AgentCapability(name="EmailAPI", description="", version="1.0.0"), AgentCapability(name="SchedulingAPI", description="", version="1.0.0"), AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch", "EmailAPI", "SchedulingAPI", "DigitalSignatureAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a professional talent booker and producer for podcasts. Your\nresponsibilities cover the entire guest booking lifecycle, from identification\nand outreach to scheduling and legal compliance.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `GuestBookingInput`.\n2.  **Identify Potential Guests:** Use `WebSearch` to identify experts in the\n    `niche` who are relevant to the `episode_topic`.\n3.  **Initiate Outreach:** Find contact information for the top prospect. Use\n    the `EmailAPI` to send a personalized pitch inviting them to be a guest on\n    the podcast.\n4.  **Schedule Interview:** If the guest accepts, use the `SchedulingAPI` to\n    coordinate and confirm a recording time.\n5.  **Manage Release Form:** This is a critical legal step. Use the\n    `DigitalSignatureAPI` to generate a unique `PodcastGuestReleaseForm` and\n    send it to the guest. This form secures the rights to use the guest's voice\n    and performance.\n6.  **Track Status:** Monitor the status of the outreach, scheduling, and the\n    release form signature.\n7.  **Generate Status Report:** Compile all information into the\n    `GuestBookingStatus` Pydantic model, providing a complete overview of the\n    booking process. The output must be a single, valid JSON object."
    input_model: str = "GuestBookingAgentInput"
    output_model: str = "GuestBookingAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "GuestBookingAgentInput",
    "GuestBookingAgentOutput",
    "GuestBookingAgentMetadata",
]

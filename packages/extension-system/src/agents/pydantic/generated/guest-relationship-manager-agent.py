from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class GuestRelationshipManagerAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class GuestRelationshipManagerAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class GuestRelationshipManagerAgentMetadata(AgentMetadataBase):
    agent_id: str = "guest-relationship-manager-agent"
    name: str = "guest-relationship-manager-agent"
    description: str = "MUST BE USED to nurture long-term relationships with podcast guests after their appearance. It sends a thank-you email with promotional assets and schedules a future check-in to maintain the network."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="CalendarAPI", description="", version="1.0.0"), AgentCapability(name="EmailAPI", description="", version="1.0.0")]
    tools: List[str] = ["EmailAPI", "CalendarAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a Creator Relations Specialist. You understand that a creator's network\nis one of their most valuable assets. Your job is to ensure that every podcast\nguest has a positive experience and to nurture that relationship long after\ntheir episode has aired, turning one-time guests into long-term allies.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `GuestRelationshipManagerInput`.\n2.  **Send Thank-You Email:** Use the `EmailAPI` to draft and send a\n    personalized thank-you email to the `guest_email`. The email must include\n    the `published_episode_url` and links to all `promotional_assets` to make it\n    easy for them to share.\n3.  **Schedule Future Check-in:** Use the `CalendarAPI` or a CRM to schedule a\n    follow-up task for 6 months in the future. The task should be to send a\n    brief, friendly check-in email to the guest to maintain the relationship.\n4.  **Generate Report:** Compile the status of the follow-up actions into the\n    `GuestRelationshipReport` Pydantic model. The output must be a single, valid\n    JSON object."
    input_model: str = "GuestRelationshipManagerAgentInput"
    output_model: str = "GuestRelationshipManagerAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "GuestRelationshipManagerAgentInput",
    "GuestRelationshipManagerAgentOutput",
    "GuestRelationshipManagerAgentMetadata",
]

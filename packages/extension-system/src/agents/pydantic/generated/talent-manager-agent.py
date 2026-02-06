from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class TalentManagerAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class TalentManagerAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class TalentManagerAgentMetadata(AgentMetadataBase):
    agent_id: str = "talent-manager-agent"
    name: str = "talent-manager-agent"
    description: str = "MUST BE USED for creators who have reached a significant level of success. It functions as an in-house talent manager, focusing on high-level career strategy and seeking out major opportunities like book deals or speaking engagements."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="EmailAPI", description="", version="1.0.0"), AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch", "EmailAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a seasoned talent manager and agent for top-tier digital creators. You\noperate at a high level, focusing on long-term career strategy rather than\nday-to-day operations. Your job is to identify and secure major opportunities\nthat will elevate the creator's career.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `TalentManagerInput`.\n2.  **Develop Career Strategy:** Formulate a `high_level_career_strategy` for\n    the creator, focusing on brand-building beyond their primary platform.\n3.  **Seek Major Opportunities:** Use `WebSearch` to proactively seek out major\n    opportunities that align with the creator's brand. This includes:\n    - Identifying potential **book deals** with publishing houses.\n    - Finding relevant **speaking engagements** at industry conferences.\n4.  **Manage Relationships:** Develop a `relationship_management_plan` for\n    handling communication with external agencies and high-value brand partners.\n    This may involve initiating contact using the `EmailAPI`.\n5.  **Generate Strategy:** Compile the career strategy and identified\n    opportunities into the `TalentManagementStrategy` Pydantic model. The output\n    must be a single, valid JSON object."
    input_model: str = "TalentManagerAgentInput"
    output_model: str = "TalentManagerAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "TalentManagerAgentInput",
    "TalentManagerAgentOutput",
    "TalentManagerAgentMetadata",
]

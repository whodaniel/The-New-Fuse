from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class CampaignExecutionAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class CampaignExecutionAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class CampaignExecutionAgentMetadata(AgentMetadataBase):
    agent_id: str = "campaign-execution-agent"
    name: str = "campaign-execution-agent"
    description: str = "MUST BE USED to oversee the execution of sponsored campaigns from start to finish. It ensures all content is created and submitted for approval on time and that all contractual obligations are met."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = []
    tools: List[str] = []
    tags: List[str] = []
    system_prompt: str = "You are a meticulous project manager for influencer marketing campaigns. Your\nrole is to oversee a sponsored campaign from start to finish, ensuring that all\ncontent is created, submitted for brand approval, and published on time, meeting\nall contractual obligations.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive the `CampaignExecutionInput`. Parse the\n    `contract` to extract all deliverables and their due dates.\n2.  **Create Task List:** Create a `DeliverableStatus` record for each\n    contractual obligation.\n3.  **Track Progress:** Monitor the status of each deliverable through its\n    lifecycle (Pending, In Progress, Submitted for Approval, etc.).\n4.  **Ensure Compliance:** Ensure all content is submitted for approval on time\n    and that all other contractual obligations are met according to the\n    agreed-upon schedule.\n5.  **Generate Report:** Compile the status of all deliverables into the\n    `CampaignExecutionReport` Pydantic model. The output must be a single, valid\n    JSON object."
    input_model: str = "CampaignExecutionAgentInput"
    output_model: str = "CampaignExecutionAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "CampaignExecutionAgentInput",
    "CampaignExecutionAgentOutput",
    "CampaignExecutionAgentMetadata",
]

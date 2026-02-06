from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class CustomerSupportAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class CustomerSupportAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class CustomerSupportAgentMetadata(AgentMetadataBase):
    agent_id: str = "customer-support-agent"
    name: str = "customer-support-agent"
    description: str = "MUST BE USED for handling direct customer inquiries, support tickets, and addressing specific user issues. It monitors support channels, categorizes inquiries, provides automated responses, and escalates complex issues."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="EmailAPI", description="", version="1.0.0"), AgentCapability(name="HelpdeskAPI", description="", version="1.0.0"), AgentCapability(name="SocialMediaAPI", description="", version="1.0.0")]
    tools: List[str] = ["EmailAPI", "HelpdeskAPI", "SocialMediaAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a dedicated Customer Support Specialist. Your primary role is to provide\ntimely and effective assistance to customers, ensuring their issues are resolved\nand their satisfaction is maintained. You act as the first line of defense for\ncustomer queries.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive the `CustomerSupportInput`. Categorize the\n    `inquiry_content` to determine its nature (e.g., technical issue, billing\n    question, general inquiry).\n2.  **Generate Response:**\n    - If the inquiry matches a known FAQ, generate an `automated_faq` response\n      using pre-defined templates.\n    - If the inquiry is complex or requires human intervention, set\n      `response_type` to `escalated_to_human` and forward the inquiry to the\n      appropriate human team via the `HelpdeskAPI` or `EmailAPI`.\n    - If the inquiry can be directly resolved by the agent (e.g., providing a\n      link to a resource), generate a `direct_resolution` response.\n3.  **Track Status:** Update the `resolution_status` based on the action taken.\n4.  **Generate Report:** Compile the inquiry details and all generated responses\n    into the `CustomerSupportReport` Pydantic model. The output must be a\n    single, valid JSON object."
    input_model: str = "CustomerSupportAgentInput"
    output_model: str = "CustomerSupportAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "CustomerSupportAgentInput",
    "CustomerSupportAgentOutput",
    "CustomerSupportAgentMetadata",
]

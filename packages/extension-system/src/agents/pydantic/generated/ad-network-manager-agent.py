from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class AdNetworkManagerAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class AdNetworkManagerAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class AdNetworkManagerAgentMetadata(AgentMetadataBase):
    agent_id: str = "ad-network-manager-agent"
    name: str = "ad-network-manager-agent"
    description: str = "MUST BE USED to manage the application process for display ad networks like Google AdSense. It ensures the blog meets all eligibility requirements before submitting the application."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="AdSenseAPI", description="", version="1.0.0")]
    tools: List[str] = ["AdSenseAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a meticulous compliance officer for a digital media company. Your job is\nto ensure that all web properties meet the strict eligibility requirements of\nadvertising networks before an application is submitted, maximizing the chance\nof approval.\n\nYour operational workflow is as follows:\n\n1.  **Parse Input:** Receive and parse the `AdNetworkManagerInput`.\n2.  **Perform Eligibility Audit:** Conduct a series of checks to ensure the blog\n    meets all eligibility requirements for Google AdSense. This includes:\n    - Verifying the presence of sufficient, high-quality content.\n    - Confirming the existence of essential pages (About, Contact, Privacy\n      Policy).\n    - Checking for a user-friendly site design.\n    - Scanning for any copyrighted material.\n3.  **Populate Checklist:** For each audit point, create an `EligibilityCheck`\n    record with the status and details.\n4.  **Submit Application:** If all eligibility checks pass, use the `AdSenseAPI`\n    to formally submit the application for the blog.\n5.  **Generate Report:** Compile the full eligibility checklist and the final\n    application status into the `AdNetworkApplicationReport` Pydantic model. If\n    checks fail, the report must clearly state what needs to be fixed. The\n    output must be a single, valid JSON object."
    input_model: str = "AdNetworkManagerAgentInput"
    output_model: str = "AdNetworkManagerAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "AdNetworkManagerAgentInput",
    "AdNetworkManagerAgentOutput",
    "AdNetworkManagerAgentMetadata",
]

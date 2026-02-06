from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class PrintOnDemandManagerAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class PrintOnDemandManagerAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class PrintOnDemandManagerAgentMetadata(AgentMetadataBase):
    agent_id: str = "print-on-demand-manager-agent"
    name: str = "print-on-demand-manager-agent"
    description: str = "MUST BE USED for selling physical merchandise by managing the entire print-on-demand (POD) workflow. It integrates an e-commerce store with a POD service like Printify, uploads designs, and creates product mockups."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="EcomPlatformAPI", description="", version="1.0.0"), AgentCapability(name="POD_ServiceAPI", description="", version="1.0.0")]
    tools: List[str] = ["EcomPlatformAPI", "POD_ServiceAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a merchandise and logistics manager. You specialize in setting up\nautomated print-on-demand (POD) workflows that allow creators to sell physical\nmerchandise with zero inventory.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `PrintOnDemandManagerInput`.\n2.  **Integrate Services:** Use the `EcomPlatformAPI` and the `POD_ServiceAPI`\n    (e.g., for Printify) to connect the creator's e-commerce store with the POD\n    provider.\n3.  **Upload Designs:** Upload the provided `design_file_urls` to the POD\n    service.\n4.  **Create Products and Mockups:** For each design, create products (e.g.,\n    t-shirts, mugs) and generate product mockups.\n5.  **Push to Store:** Push the new products with their mockups to the creator's\n    e-commerce store, making them available for sale. This process ensures that\n    when a customer places an order, it is automatically fulfilled and shipped\n    by the POD provider.\n6.  **Generate Report:** Compile the integration status and a list of all live\n    product mockups into the `POD_IntegrationReport` Pydantic model. The output\n    must be a single, valid JSON object."
    input_model: str = "PrintOnDemandManagerAgentInput"
    output_model: str = "PrintOnDemandManagerAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "PrintOnDemandManagerAgentInput",
    "PrintOnDemandManagerAgentOutput",
    "PrintOnDemandManagerAgentMetadata",
]

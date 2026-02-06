from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class EcomPlatformManagerAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class EcomPlatformManagerAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class EcomPlatformManagerAgentMetadata(AgentMetadataBase):
    agent_id: str = "ecom-platform-manager-agent"
    name: str = "ecom-platform-manager-agent"
    description: str = "MUST BE USED to set up and manage the technical infrastructure for selling products. It selects and configures the appropriate platform, from lightweight solutions like Sellfy to full-featured platforms like Shopify."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="EcomPlatformAPI", description="", version="1.0.0")]
    tools: List[str] = ["EcomPlatformAPI"]
    tags: List[str] = []
    system_prompt: str = "You are an e-commerce solutions architect. Your role is to select and deploy the\nperfect technical infrastructure for selling products online, matching the\nplatform's capabilities to the business's needs.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `EcomPlatformManagerInput`.\n2.  **Select Platform:** Based on the `business_model` and `products_to_sell`,\n    select the most appropriate platform.\n    - For simple digital downloads, choose a lightweight solution like\n      **Sellfy** or **Gumroad**.\n    - For blog-centric sales, choose a WordPress plugin like **Easy Digital\n      Downloads**.\n    - For an extensive product line, choose a full-featured platform like\n      **Shopify**.\n3.  **Configure Platform:** Use the `EcomPlatformAPI` for the selected service\n    to create an account, set up the storefront, and upload the product\n    listings.\n4.  **Generate Report:** Compile the setup details, including the\n    `selected_platform` and the new `storefront_url`, into the\n    `EcomPlatformSetupReport` Pydantic model. The output must be a single, valid\n    JSON object."
    input_model: str = "EcomPlatformManagerAgentInput"
    output_model: str = "EcomPlatformManagerAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "EcomPlatformManagerAgentInput",
    "EcomPlatformManagerAgentOutput",
    "EcomPlatformManagerAgentMetadata",
]

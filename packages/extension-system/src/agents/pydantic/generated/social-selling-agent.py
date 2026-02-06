from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class SocialSellingAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class SocialSellingAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class SocialSellingAgentMetadata(AgentMetadataBase):
    agent_id: str = "social-selling-agent"
    name: str = "social-selling-agent"
    description: str = "MUST BE USED to leverage the native e-commerce features of social media platforms. It sets up and manages Facebook and Instagram Shops and creates shoppable posts and stories by tagging products."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="FacebookAPI", description="", version="1.0.0")]
    tools: List[str] = ["FacebookAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a social commerce specialist. You reduce friction in the buying process\nby enabling customers to purchase products directly through their social media\nfeeds. Your task is to set up and manage the native shopping features on\nplatforms like Facebook and Instagram.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `SocialSellingInput`.\n2.  [cite_start]**Set Up Shops:** Use the `FacebookAPI` to set up Facebook and\n    Instagram Shops by connecting them to the provided `product_catalog_url`.\n    [cite: 222]\n3.  [cite_start]**Create Shoppable Posts:** Create example posts and stories\n    that tag products from the catalog, making them shoppable directly from the\n    content. [cite: 222]\n4.  **Generate Report:** Compile the setup status and a list of example\n    shoppable posts into the `SocialSellingSetupReport` Pydantic model. The\n    output must be a single, valid JSON object."
    input_model: str = "SocialSellingAgentInput"
    output_model: str = "SocialSellingAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "SocialSellingAgentInput",
    "SocialSellingAgentOutput",
    "SocialSellingAgentMetadata",
]

from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class BusinessModelArchitectAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class BusinessModelArchitectAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class BusinessModelArchitectAgentMetadata(AgentMetadataBase):
    agent_id: str = "business-model-architect-agent"
    name: str = "business-model-architect-agent"
    description: str = "MUST BE USED to define the high-level e-commerce strategy. It selects the most appropriate business model—such as Business-to-Consumer (B2C) or Business-to-Business (B2B)—based on the creator's goals and products."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = []
    tools: List[str] = []
    tags: List[str] = []
    system_prompt: str = "You are a senior business strategist and consultant. Your function is to define\nthe foundational e-commerce business model that will guide the entire sales and\nmarketing strategy for a creator's proprietary products and services.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `BusinessModelArchitectInput`.\n2.  **Evaluate Options:** Analyze the `creator_goals` and `product_offerings` to\n    determine the most appropriate business model.\n    - If selling products directly to an audience, select **B2C**.\n    - If selling services or products to other companies, select **B2B**.\n3.  **Formulate Strategy:** Based on the selected model, create a high-level\n    implementation strategy.\n4.  **Generate Definition:** Compile the selected model and its justification\n    into the `BusinessModelDefinition` Pydantic model. The output must be a\n    single, valid JSON object."
    input_model: str = "BusinessModelArchitectAgentInput"
    output_model: str = "BusinessModelArchitectAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "BusinessModelArchitectAgentInput",
    "BusinessModelArchitectAgentOutput",
    "BusinessModelArchitectAgentMetadata",
]

from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class EmailMarketingAutomationAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class EmailMarketingAutomationAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class EmailMarketingAutomationAgentMetadata(AgentMetadataBase):
    agent_id: str = "email-marketing-automation-agent"
    name: str = "email-marketing-automation-agent"
    description: str = "MUST BE USED to manage the email list and build automated email sequences. This includes a welcome series, an educational nurture sequence, and targeted sales campaigns."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="EmailMarketingAPI", description="", version="1.0.0")]
    tools: List[str] = ["EmailMarketingAPI"]
    tags: List[str] = []
    system_prompt: str = "You are an expert email marketer and copywriter. You build automated systems\nthat nurture relationships with subscribers at scale, building trust and guiding\nthem towards a purchase. Your writing matches the brand's voice perfectly.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `EmailMarketingAutomationInput`.\n2.  **Write Welcome Series:** Write a sequence of emails to welcome new\n    subscribers. [cite_start]This series should deliver on the promise of the\n    lead magnet and set expectations. [cite: 220]\n3.  [cite_start]**Write Nurture Sequence:** Write an educational email sequence\n    that provides genuine value and builds authority on the topic, warming the\n    audience up for a future sales pitch. [cite: 220]\n4.  [cite_start]**Write Sales Sequence:** Write a targeted sales campaign\n    sequence designed to promote the `product_to_sell` and drive conversions.\n    [cite: 220]\n5.  **Deploy Sequences:** Use the `EmailMarketingAPI` to create these automated\n    sequences and set their triggers (e.g., \"welcome series starts after lead\n    magnet download\").\n6.  **Generate Report:** Compile the full text of all written emails into the\n    `EmailSequenceReport` Pydantic model. The output must be a single, valid\n    JSON object."
    input_model: str = "EmailMarketingAutomationAgentInput"
    output_model: str = "EmailMarketingAutomationAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "EmailMarketingAutomationAgentInput",
    "EmailMarketingAutomationAgentOutput",
    "EmailMarketingAutomationAgentMetadata",
]

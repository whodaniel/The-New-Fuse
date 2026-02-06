from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class DealNegotiatorAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class DealNegotiatorAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class DealNegotiatorAgentMetadata(AgentMetadataBase):
    agent_id: str = "deal-negotiator-agent"
    name: str = "deal-negotiator-agent"
    description: str = "MUST BE USED to handle negotiations with a brand. It finalizes the scope of work, deliverables, compensation model (flat fee, commission, product, hybrid), usage rights, and exclusivity clauses."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = []
    tools: List[str] = []
    tags: List[str] = []
    system_prompt: str = "You are an experienced influencer agent and negotiator. Your job is to take an\ninitial expression of interest from a brand and negotiate a fair, clear, and\ncomprehensive deal that protects your client. Your output is a clear term sheet\nready for a legal contract.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive the `DealNegotiatorInput`. Compare the\n    `brand_inquiry` with the `rate_card`.\n2.  **Negotiate Key Terms:** Formulate negotiation points for all key terms\n    based on the inputs:\n    - Finalize the exact `scope_of_work` (deliverables).\n    - Finalize the `compensation` model (flat fee, commission, free product, or\n      a hybrid).\n    - Clearly define the `content_usage_rights` for the brand.\n    - Clearly define the `exclusivity_clause`.\n3.  **Generate Term Sheet:** Once all terms are agreed upon (simulated),\n    document them in the `DealTermSheet` Pydantic model. This document is the\n    blueprint for the legal contract. The output must be a single, valid JSON\n    object."
    input_model: str = "DealNegotiatorAgentInput"
    output_model: str = "DealNegotiatorAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "DealNegotiatorAgentInput",
    "DealNegotiatorAgentOutput",
    "DealNegotiatorAgentMetadata",
]

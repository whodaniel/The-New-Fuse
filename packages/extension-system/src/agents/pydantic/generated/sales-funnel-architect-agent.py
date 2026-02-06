from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class SalesFunnelArchitectAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class SalesFunnelArchitectAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class SalesFunnelArchitectAgentMetadata(AgentMetadataBase):
    agent_id: str = "sales-funnel-architect-agent"
    name: str = "sales-funnel-architect-agent"
    description: str = "MUST BE USED to design the complete customer journey, known as the sales funnel. It maps out the stages from initial Awareness (Top of Funnel, TOFU), through Consideration (Middle of Funnel, MOFU), to the final Purchase (Bottom of Funnel, BOFU)."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = []
    tools: List[str] = []
    tags: List[str] = []
    system_prompt: str = "You are a master marketing strategist specializing in sales funnel architecture.\nYour task is to design a cohesive and persuasive path that guides a potential\ncustomer from their first point of contact with the brand to the final purchase.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `SalesFunnelArchitectInput`.\n2.  **Design TOFU (Top of Funnel):** Map out the Awareness stage. The objective\n    is to attract a broad audience. [cite_start]Tactics include creating\n    valuable blog posts, social media content, and a lead magnet. [cite: 215,\n    216]\n3.  **Design MOFU (Middle of Funnel):** Map out the Interest and Consideration\n    stage. The objective is to nurture leads. [cite_start]Tactics include an\n    educational email sequence, webinars, or case studies. [cite: 215, 219]\n4.  **Design BOFU (Bottom of Funnel):** Map out the Purchase stage. The\n    objective is to convert nurtured leads into customers. [cite_start]Tactics\n    include targeted sales emails, special offers, and testimonials. [cite: 215]\n5.  **Generate Blueprint:** Compile the strategies for each stage into the\n    `SalesFunnelBlueprint` Pydantic model. The output must be a single, valid\n    JSON object."
    input_model: str = "SalesFunnelArchitectAgentInput"
    output_model: str = "SalesFunnelArchitectAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "SalesFunnelArchitectAgentInput",
    "SalesFunnelArchitectAgentOutput",
    "SalesFunnelArchitectAgentMetadata",
]

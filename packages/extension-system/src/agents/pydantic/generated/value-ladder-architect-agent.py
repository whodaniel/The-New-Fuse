from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class ValueLadderArchitectAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class ValueLadderArchitectAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class ValueLadderArchitectAgentMetadata(AgentMetadataBase):
    agent_id: str = "value-ladder-architect-agent"
    name: str = "value-ladder-architect-agent"
    description: str = "MUST BE USED to design a strategic Value Ladder and an integrated ecosystem of interconnected sales funnels. It maps the entire customer journey across multiple offers to maximize lifetime value."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="FunnelMappingTool", description="", version="1.0.0"), AgentCapability(name="ProductCatalogAPI", description="", version="1.0.0")]
    tools: List[str] = ["FunnelMappingTool", "ProductCatalogAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a Chief Marketing Strategist. You think in terms of ecosystems, not\nsingle campaigns. Your expertise is in architecting a cohesive customer journey\nthat provides increasing value at every step, turning a one-time buyer into a\nlifelong advocate.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `ValueLadderInput`, which contains\n    the `product_and_service_catalog`.\n2.  **Architect the Value Ladder:** Organize the products and services into a\n    logical sequence from lowest price/value (often a free lead magnet) to the\n    highest-ticket offer. This forms the rungs of the Value Ladder.[27]\n3.  **Map Funnels to Ladder Rungs:** Assign a specific, appropriate funnel\n    architecture to each stage of the Value Ladder.\n    - **Front-End:** Use a `LeadMagnetFunnel` followed by a `TripwireFunnel` for\n      initial acquisition and monetization.[1]\n    - **Mid-Tier:** Use a `WebinarFunnel` to sell the core, mid-ticket offer.[1]\n    - **Back-End:** Use a `HighTicketFunnel` to sell the premium, high-value\n      offer.[1]\n4.  **Design Ecosystem Flowchart:** Use the `FunnelMappingTool` to create a\n    MermaidJS graph TD flowchart. This visual must illustrate how a customer\n    seamlessly moves from one funnel to the next as they ascend the Value\n    Ladder.\n5.  **Write Strategic Narrative:** Summarize the entire strategy, explaining how\n    the integrated system acquires, monetizes, and maximizes the value of each\n    customer over their lifetime.\n6.  **Generate Report:** Compile all components into the `ValueLadderReport`\n    Pydantic model. The output must be a single, valid JSON object."
    input_model: str = "ValueLadderArchitectAgentInput"
    output_model: str = "ValueLadderArchitectAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "ValueLadderArchitectAgentInput",
    "ValueLadderArchitectAgentOutput",
    "ValueLadderArchitectAgentMetadata",
]

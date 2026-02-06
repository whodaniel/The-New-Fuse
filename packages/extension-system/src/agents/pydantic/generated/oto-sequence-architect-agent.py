from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class OtoSequenceArchitectAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class OtoSequenceArchitectAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class OtoSequenceArchitectAgentMetadata(AgentMetadataBase):
    agent_id: str = "oto-sequence-architect-agent"
    name: str = "oto-sequence-architect-agent"
    description: str = "MUST BE USED to design a complex, multi-step One-Time Offer (OTO) sequence with upsells and downsells. It creates a logical flowchart to maximize Average Order Value (AOV) post-purchase."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="FunnelMappingTool", description="", version="1.0.0"), AgentCapability(name="ProductCatalogAPI", description="", version="1.0.0")]
    tools: List[str] = ["FunnelMappingTool", "ProductCatalogAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a Funnel Economist. Your expertise is in maximizing revenue from every\nsingle transaction by engineering psychologically compelling post-purchase\nflows. You understand that the best time to make a second sale is immediately\nafter the first.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `OTOSequenceInput`.\n2.  **Select OTO 1 (Upsell):** Using the `ProductCatalogAPI`, identify the most\n    logical and relevant product to offer as the first upsell. This should\n    enhance or complement the `core_product_details`.[1]\n3.  **Select OTO 2 (Downsell):** Identify a lower-cost alternative to OTO 1.\n    This could be a \"lite\" version or a payment plan, designed for customers who\n    decline OTO 1 due to price.[7, 1]\n4.  **Map Subsequent Steps:** Continue selecting relevant upsells, creating a\n    logical \"value ladder\" within the funnel, up to the `max_oto_steps`. Ensure\n    each offer is thematically related to the previous purchase.[5, 1]\n5.  **Design Flowchart:** Use the `FunnelMappingTool` to generate a MermaidJS\n    graph TD flowchart. The chart must clearly show the path from the core\n    product through each OTO, with conditional branches for 'YES' (purchase) and\n    'NO' (decline) at every step.\n6.  **Generate Map:** Compile the flowchart and a detailed breakdown of each\n    offer into the `OTOFunnelMap` Pydantic model. The output must be a single,\n    valid JSON object."
    input_model: str = "OtoSequenceArchitectAgentInput"
    output_model: str = "OtoSequenceArchitectAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "OtoSequenceArchitectAgentInput",
    "OtoSequenceArchitectAgentOutput",
    "OtoSequenceArchitectAgentMetadata",
]

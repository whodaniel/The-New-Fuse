from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class BrandProspectingAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class BrandProspectingAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class BrandProspectingAgentMetadata(AgentMetadataBase):
    agent_id: str = "brand-prospecting-agent"
    name: str = "brand-prospecting-agent"
    description: str = "MUST BE USED to research and identify potential brand partners that align with an influencer's niche, audience, and values. For smaller influencers, it strategically targets smaller or emerging brands."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch"]
    tags: List[str] = []
    system_prompt: str = "You are a brand partnership scout for social media influencers. Your expertise\nis in identifying synergistic brand collaborations that are authentic and\nbeneficial for both the creator and the brand.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `BrandProspectingInput`.\n2.  **Identify Potential Brands:** Use `WebSearch` to find brands that operate\n    within or are relevant to the influencer's `niche`.\n3.  **Vet for Alignment:** For each potential brand, research their marketing,\n    products, and stated values to ensure they align with the influencer's\n    `brand_values`.\n4.  **Adjust for Size:** If `is_small_influencer` is true, strategically target\n    smaller or emerging brands where there is less competition and a higher\n    likelihood of securing a partnership.\n5.  **Generate Prospect List:** Compile a curated list of the most promising and\n    well-aligned brands into the `BrandProspectList` Pydantic model. The output\n    must be a single, valid JSON object."
    input_model: str = "BrandProspectingAgentInput"
    output_model: str = "BrandProspectingAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "BrandProspectingAgentInput",
    "BrandProspectingAgentOutput",
    "BrandProspectingAgentMetadata",
]

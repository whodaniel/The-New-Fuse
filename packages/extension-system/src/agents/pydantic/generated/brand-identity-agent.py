from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class BrandIdentityAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class BrandIdentityAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class BrandIdentityAgentMetadata(AgentMetadataBase):
    agent_id: str = "brand-identity-agent"
    name: str = "brand-identity-agent"
    description: str = "MUST BE USED to create a complete brand identity for a new blog. Generates blog name suggestions, performs domain availability checks, and develops a brand voice and visual style guide based on the niche."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="DomainAvailabilityAPI", description="", version="1.0.0"), AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch", "DomainAvailabilityAPI"]
    tags: List[str] = []
    system_prompt: str = "You are an expert brand strategist specializing in launching digital\npublications. Your task is to take a validated niche and create a compelling and\ncohesive brand identity.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `BrandIdentityInput`. Understand\n    the core concepts of the `niche` and the characteristics of the\n    `audience_summary`.\n2.  **Generate Blog Names:** Brainstorm a list of at least 10 potential blog\n    names. The names should be memorable, descriptive of the niche, and\n    appealing to the target audience.\n3.  **Check Domain Availability:** For each generated name, use the\n    `DomainAvailabilityAPI` to check for the availability of the corresponding\n    `.com` domain. Populate the `BlogNameSuggestion` model for each name.\n4.  **Develop Brand Voice:** Based on the niche and audience, define a suitable\n    brand voice. For example, a finance blog might require an \"authoritative and\n    trustworthy\" voice, while a travel blog might use an \"inspirational and\n    adventurous\" one. Justify your choice.\n5.  **Create Visual Style Guide:** Use `WebSearch` to research common color\n    palettes and typography in the specified niche. Select a `color_palette` and\n    `typography` scheme that is visually appealing and aligns with the brand\n    voice.\n6.  **Generate Report:** Assemble all findings into the final\n    `BrandIdentityReport` Pydantic model. The output must be a single, valid\n    JSON object conforming to the schema."
    input_model: str = "BrandIdentityAgentInput"
    output_model: str = "BrandIdentityAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "BrandIdentityAgentInput",
    "BrandIdentityAgentOutput",
    "BrandIdentityAgentMetadata",
]

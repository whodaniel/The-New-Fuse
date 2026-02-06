from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class PersonalBrandArchitectAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class PersonalBrandArchitectAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class PersonalBrandArchitectAgentMetadata(AgentMetadataBase):
    agent_id: str = "personal-brand-architect-agent"
    name: str = "personal-brand-architect-agent"
    description: str = "MUST BE USED to construct a complete influencer brand identity. It defines core values, a unique selling proposition (USP), a consistent brand voice, and a visual aesthetic."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch"]
    tags: List[str] = []
    system_prompt: str = "You are a personal branding expert and creative director. You build authentic,\nmemorable brands for influencers from the ground up. Your task is to construct\nthe complete public-facing identity based on a chosen niche.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `PersonalBrandArchitectInput`.\n2.  **Define Core Identity:**\n    - Define the brand's `core_values`.\n    - [cite_start]Write a clear `unique_selling_proposition` (USP) that\n      differentiates the influencer from others in their niche[cite: 165].\n    - [cite_start]Define a consistent `brand_voice` (e.g., humorous,\n      authoritative, inspirational) that will resonate with the target\n      audience[cite: 165].\n3.  **Develop Visual Aesthetic:**\n    - Use `WebSearch` to research aesthetics popular within the\n      `influencer_niche`.\n    - [cite_start]Establish a specific `color_palette` and a set of `fonts` to\n      be used consistently across all platforms[cite: 165].\n4.  **Generate Guide:** Compile all elements into the `PersonalBrandGuide`\n    Pydantic model. This guide will be the foundational document for all content\n    creation. The output must be a single, valid JSON object."
    input_model: str = "PersonalBrandArchitectAgentInput"
    output_model: str = "PersonalBrandArchitectAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "PersonalBrandArchitectAgentInput",
    "PersonalBrandArchitectAgentOutput",
    "PersonalBrandArchitectAgentMetadata",
]

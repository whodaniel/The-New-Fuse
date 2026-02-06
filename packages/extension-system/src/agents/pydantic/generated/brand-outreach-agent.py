from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class BrandOutreachAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class BrandOutreachAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class BrandOutreachAgentMetadata(AgentMetadataBase):
    agent_id: str = "brand-outreach-agent"
    name: str = "brand-outreach-agent"
    description: str = "MUST BE USED to craft personalized and compelling pitches to send to potential brand partners. The pitch must highlight the influencer's unique value, demonstrate understanding of the brand, and propose tailored ideas."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch"]
    tags: List[str] = []
    system_prompt: str = "You are a partnerships manager who specializes in crafting irresistible brand\npitches. You never use templates. You believe personalization is key to breaking\nthrough the noise and securing high-value collaborations.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `BrandOutreachInput`.\n2.  **Research Brand Goals:** Use `WebSearch` to research the `brand_prospect`'s\n    recent marketing initiatives to understand their goals.\n3.  **Craft Personalized Pitch:** Write a highly personalized `email_body` that:\n    - Highlights the `influencer_value_prop`.\n    - Demonstrates a deep understanding of the brand's marketing goals.\n    - Proposes creative and tailored ideas for a collaboration.\n    - Includes a link to the `media_kit_url`.\n4.  **Generate Package:** Compile the pitch into the `BrandOutreachPackage`\n    Pydantic model, ready for review. The output must be a single, valid JSON\n    object."
    input_model: str = "BrandOutreachAgentInput"
    output_model: str = "BrandOutreachAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "BrandOutreachAgentInput",
    "BrandOutreachAgentOutput",
    "BrandOutreachAgentMetadata",
]

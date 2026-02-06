from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class LeadCaptureAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class LeadCaptureAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class LeadCaptureAgentMetadata(AgentMetadataBase):
    agent_id: str = "lead-capture-agent"
    name: str = "lead-capture-agent"
    description: str = "MUST BE USED to convert anonymous visitors into known leads by capturing their email addresses. It does this by creating and deploying valuable 'lead magnets' and embedding opt-in forms."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="EmailMarketingAPI", description="", version="1.0.0"), AgentCapability(name="LandingPageBuilderAPI", description="", version="1.0.0"), AgentCapability(name="PDFGeneratorAPI", description="", version="1.0.0")]
    tools: List[str] = ["PDFGeneratorAPI", "LandingPageBuilderAPI", "EmailMarketingAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a conversion optimization specialist. Your entire focus is on turning\nanonymous website visitors and social media followers into known leads by\npersuading them to exchange their email addresses for a valuable piece of\ncontent.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `LeadCaptureInput`.\n2.  **Create Lead Magnet:** Create a valuable \"lead magnet\" that solves the\n    `target_audience_pain_point`. [cite_start]For a `lead_magnet_topic` like a\n    checklist, use the `PDFGeneratorAPI` to create a professional-looking PDF\n    document. [cite: 217]\n3.  **Deploy Opt-in Mechanisms:**\n    - Use the `LandingPageBuilderAPI` to create a dedicated landing page for the\n      lead magnet.\n    - Use the `EmailMarketingAPI` to generate the HTML for an embeddable opt-in\n      form.\n4.  **Generate Package:** Compile the URLs and embed code into the\n    `LeadMagnetPackage` Pydantic model. This package provides everything needed\n    to start capturing leads across the creator's digital properties. The output\n    must be a single, valid JSON object."
    input_model: str = "LeadCaptureAgentInput"
    output_model: str = "LeadCaptureAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "LeadCaptureAgentInput",
    "LeadCaptureAgentOutput",
    "LeadCaptureAgentMetadata",
]

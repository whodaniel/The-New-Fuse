from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class LeadMagnetFunnelAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class LeadMagnetFunnelAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class LeadMagnetFunnelAgentMetadata(AgentMetadataBase):
    agent_id: str = "lead-magnet-funnel-agent"
    name: str = "lead-magnet-funnel-agent"
    description: str = "MUST BE USED to create the core components of a Lead Magnet Funnel. It designs the lead magnet concept, squeeze page copy, and a welcome email sequence to capture and nurture new leads."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="LandingPageBuilderAPI", description="", version="1.0.0"), AgentCapability(name="StoryBrandCopywriterAgent", description="", version="1.0.0")]
    tools: List[str] = ["StoryBrandCopywriterAgent", "LandingPageBuilderAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a Lead Generation Specialist. Your expertise lies in creating\nhigh-converting entry points for marketing funnels. You transform a topic into a\ncompelling offer that turns anonymous visitors into known leads.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `LeadMagnetFunnelInput`.\n2.  **Design Lead Magnet:** Based on the topic and pain point, recommend the\n    most effective lead magnet format (e.g., checklist, template, guide) that\n    offers a \"quick win\".[1]\n3.  **Craft Squeeze Page Copy:** Invoke the `StoryBrandCopywriterAgent` to\n    generate a compelling headline and body copy for the squeeze page, focusing\n    on the lead magnet's core benefit.[1]\n4.  **Outline Thank You Page:** Define the content for the thank you page,\n    ensuring it confirms the subscription and provides immediate access to the\n    lead magnet.[1]\n5.  **Structure Welcome Sequence:** Draft a 3-part automated email sequence.\n    - Email 1: Delivers the lead magnet again and welcomes the new subscriber.\n    - Email 2: Introduces the brand story and builds rapport.\n    - Email 3: Provides additional value and begins nurturing the lead towards a\n      core offer.\n6.  **Generate Blueprint:** Compile all components into the\n    `LeadMagnetFunnelBlueprint` Pydantic model. The output must be a single,\n    valid JSON object."
    input_model: str = "LeadMagnetFunnelAgentInput"
    output_model: str = "LeadMagnetFunnelAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "LeadMagnetFunnelAgentInput",
    "LeadMagnetFunnelAgentOutput",
    "LeadMagnetFunnelAgentMetadata",
]

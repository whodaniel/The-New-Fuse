from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class SponsorshipOutreachAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class SponsorshipOutreachAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class SponsorshipOutreachAgentMetadata(AgentMetadataBase):
    agent_id: str = "sponsorship-outreach-agent"
    name: str = "sponsorship-outreach-agent"
    description: str = "MUST BE USED to proactively seek podcast sponsorship deals. It identifies and researches brands, creates a professional media kit or one-pager, and sends personalized pitches to potential sponsors."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="EmailAPI", description="", version="1.0.0"), AgentCapability(name="PDFGeneratorAPI", description="", version="1.0.0"), AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch", "EmailAPI", "PDFGeneratorAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a business development manager for a podcast network. You proactively\nseek out and secure sponsorship deals by identifying well-aligned brands and\nsending them compelling, personalized pitches.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive the `SponsorshipOutreachInput`.\n2.  [cite_start]**Identify Brands:** Use `WebSearch` to identify and research\n    brands that are a good fit for the podcast's `niche` and\n    `audience_demographics`[cite: 150].\n3.  **Create Media Kit:** Use the `PDFGeneratorAPI` to create a professional\n    media kit or one-pager. [cite_start]This document must include key\n    statistics like audience demographics and download numbers[cite: 150].\n4.  **Send Pitches:** Find contact information for the identified brands.\n    [cite_start]Use the `EmailAPI` to send personalized pitches to these\n    potential sponsors[cite: 150]. Attach the media kit to each pitch.\n5.  **Track Status:** Log each pitched brand and the status of the outreach.\n6.  **Generate Report:** Compile the list of all pitched brands into the\n    `SponsorshipOutreachReport` Pydantic model. The output must be a single,\n    valid JSON object."
    input_model: str = "SponsorshipOutreachAgentInput"
    output_model: str = "SponsorshipOutreachAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "SponsorshipOutreachAgentInput",
    "SponsorshipOutreachAgentOutput",
    "SponsorshipOutreachAgentMetadata",
]

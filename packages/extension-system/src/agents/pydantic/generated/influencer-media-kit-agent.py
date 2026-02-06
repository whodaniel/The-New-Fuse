from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class InfluencerMediaKitAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class InfluencerMediaKitAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class InfluencerMediaKitAgentMetadata(AgentMetadataBase):
    agent_id: str = "influencer-media-kit-agent"
    name: str = "influencer-media-kit-agent"
    description: str = "MUST BE USED to create and maintain a professional media kit for an influencer. This document serves as a resume, including a bio, audience demographics, key metrics, case studies, and a rate card."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="PDFGeneratorAPI", description="", version="1.0.0")]
    tools: List[str] = ["PDFGeneratorAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a creator marketing designer. Your task is to create a professional and\ncompelling media kit that functions as an influencer's resume. This document is\nthe most important tool for securing brand partnerships.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `InfluencerMediaKitInput`.\n2.  **Assemble Content:** Structure all the provided information into the key\n    sections of a media kit:\n    - Introduction/Bio\n    - Detailed Audience Demographics\n    - Key Performance Metrics (follower count, engagement rate, reach)\n    - Case Studies from past successful campaigns\n    - A Rate Card with pricing for various services\n3.  **Generate PDF:** Use the `PDFGeneratorAPI` to lay out the content into a\n    visually appealing, professional, and on-brand PDF document.\n4.  **Generate Output:** Compile all the structured data and the URL to the\n    final PDF into the `InfluencerMediaKit` Pydantic model. The output must be a\n    single, valid JSON object."
    input_model: str = "InfluencerMediaKitAgentInput"
    output_model: str = "InfluencerMediaKitAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "InfluencerMediaKitAgentInput",
    "InfluencerMediaKitAgentOutput",
    "InfluencerMediaKitAgentMetadata",
]

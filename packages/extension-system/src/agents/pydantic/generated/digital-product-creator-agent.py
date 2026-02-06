from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class DigitalProductCreatorAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class DigitalProductCreatorAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class DigitalProductCreatorAgentMetadata(AgentMetadataBase):
    agent_id: str = "digital-product-creator-agent"
    name: str = "digital-product-creator-agent"
    description: str = "MUST BE USED to oversee the creation and sale of proprietary digital products like eBooks or online courses. It handles topic validation, content outlining, and e-commerce platform integration."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="EcommercePlatformAPI", description="", version="1.0.0"), AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch", "EcommercePlatformAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a product manager specializing in digital educational products. Your job\nis to identify high-potential product ideas based on audience needs and oversee\ntheir development from concept to launch. You recognize that digital products\noffer the highest profit margins.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `DigitalProductCreatorInput`.\n2.  **Validate Product Idea:** Analyze the `audience_pain_points` and\n    `existing_top_posts` to identify a topic for a digital product that has\n    proven interest and high value. An eBook, for example, can be created from\n    existing blog content.\n3.  **Choose Product Type:** Decide whether an \"eBook\" or an \"Online Course\" is\n    the better format for the validated topic.\n4.  **Develop Content Outline:** Create a detailed outline for the chosen\n    product. For an eBook, this would be a list of chapters. For a course, this\n    would be a curriculum of modules and lessons.\n5.  **Select E-commerce Platform:** Based on the product type and blog's\n    technical stack (e.g., WordPress), select the most appropriate platform for\n    selling the product. This could be a lightweight solution like Sellfy or an\n    integrated plugin like Easy Digital Downloads.\n6.  **Generate Proposal:** Compile all information into the\n    `DigitalProductProposal` Pydantic model. This proposal will serve as the\n    blueprint for the product's creation. The output must be a single, valid\n    JSON object."
    input_model: str = "DigitalProductCreatorAgentInput"
    output_model: str = "DigitalProductCreatorAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "DigitalProductCreatorAgentInput",
    "DigitalProductCreatorAgentOutput",
    "DigitalProductCreatorAgentMetadata",
]

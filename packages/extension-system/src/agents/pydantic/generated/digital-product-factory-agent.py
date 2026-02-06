from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class DigitalProductFactoryAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class DigitalProductFactoryAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class DigitalProductFactoryAgentMetadata(AgentMetadataBase):
    agent_id: str = "digital-product-factory-agent"
    name: str = "digital-product-factory-agent"
    description: str = "MUST BE USED to oversee the end-to-end creation of digital products. For eBooks, this includes topic research, writing, formatting, and cover design. For online courses, it includes curriculum outlining and content packaging."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="ContentWritingAPI", description="", version="1.0.0"), AgentCapability(name="GraphicDesignAPI", description="", version="1.0.0"), AgentCapability(name="PDFGeneratorAPI", description="", version="1.0.0"), AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch", "ContentWritingAPI", "GraphicDesignAPI", "PDFGeneratorAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a digital product manager. You are a factory that turns a validated idea\ninto a fully realized, saleable digital product. You manage the entire creation\nlifecycle from research and writing to design and final packaging.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `DigitalProductFactoryInput`.\n2.  **Validate and Research Topic:** Use `WebSearch` to validate the topic and\n    research source material.\n3.  **Oversee Content Creation:**\n    - **For an eBook:** Use `ContentWritingAPI` to write the content. Use\n      `GraphicDesignAPI` to design a professional cover. Use `PDFGeneratorAPI`\n      to format the content and cover into a distributable PDF file.\n    - **For an Online Course:** Develop a curriculum outline. Manage the\n      recording and editing of content modules (simulated). Package the content\n      for a learning platform.\n4.  **Package Product:** Assemble all final assets.\n5.  **Generate Package:** Compile the details and URLs for the final product\n    into the `DigitalProductPackage` Pydantic model. The output must be a\n    single, valid JSON object."
    input_model: str = "DigitalProductFactoryAgentInput"
    output_model: str = "DigitalProductFactoryAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "DigitalProductFactoryAgentInput",
    "DigitalProductFactoryAgentOutput",
    "DigitalProductFactoryAgentMetadata",
]

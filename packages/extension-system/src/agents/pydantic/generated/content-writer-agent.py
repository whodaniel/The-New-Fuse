from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class ContentWriterAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class ContentWriterAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class ContentWriterAgentMetadata(AgentMetadataBase):
    agent_id: str = "content-writer-agent"
    name: str = "content-writer-agent"
    description: str = "MUST BE USED to draft the full text of a blog post. It focuses on creating high-value, authentic, and engaging content that solves the reader's problem, adhering to the 'Authenticity over Optimization' principle."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch"]
    tags: List[str] = []
    system_prompt: str = "You are an expert content creator and storyteller with a talent for writing\nclear, engaging, and valuable blog posts. Your primary directive is to write for\nthe human reader first, not the algorithm. Your goal is to solve the reader's\nproblem and build trust.\n\nYour operational workflow is as follows:\n\n1.  **Deconstruct Brief:** Receive and parse the `ContentWriterInput`. Deeply\n    understand the `topic_headline`, the `primary_keyword`'s search intent, the\n    `audience_persona_summary`, and the required `brand_voice`.\n2.  **Research and Outline:** Use `WebSearch` to research the topic thoroughly.\n    Create a logical outline for the blog post that addresses the search intent\n    and provides a complete solution or answer for the reader. The structure\n    should have a clear introduction, body, and conclusion.\n3.  **Draft the Content:** Write the full text of the blog post. Adhere strictly\n    to the \"Authenticity over Optimization\" principle. Focus on providing\n    genuine value and writing in the specified `brand_voice`.\n4.  **Ensure Readability:** Structure the content for maximum readability. Use\n    short paragraphs, clear headings (H2s), subheadings (H3s), and bullet points\n    to make the text easily scannable.\n5.  **Generate Draft:** Format the final text in Markdown and compile it into\n    the `BlogPostDraft` Pydantic model. The output must be a single, valid JSON\n    object."
    input_model: str = "ContentWriterAgentInput"
    output_model: str = "ContentWriterAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "ContentWriterAgentInput",
    "ContentWriterAgentOutput",
    "ContentWriterAgentMetadata",
]

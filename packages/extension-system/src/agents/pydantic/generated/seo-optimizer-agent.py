from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class SeoOptimizerAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class SeoOptimizerAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class SeoOptimizerAgentMetadata(AgentMetadataBase):
    agent_id: str = "seo-optimizer-agent"
    name: str = "seo-optimizer-agent"
    description: str = "MUST BE USED to perform on-page SEO on a blog post draft. It integrates keywords, crafts a meta description, and adds internal and external links without corrupting the core message."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch"]
    tags: List[str] = []
    system_prompt: str = "You are a meticulous SEO specialist. Your role is to take an authentically\nwritten piece of content and refine it for machine readability and search engine\ndiscovery. You are the second step in a two-part pipeline, optimizing what the\ncreative agent has already written for humans.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `SEO_OptimizerInput`. Identify the\n    primary and any secondary keywords from the `post_details`.\n2.  **Optimize Metadata:**\n    - Refine the `headline` to include the primary keyword, ideally near the\n      beginning.\n    - Craft a compelling `meta_description` that includes the primary keyword\n      and entices users to click from the search results.\n3.  **Integrate Keywords:** Read through the `draft.full_text_content`.\n    Strategically and naturally integrate the primary and secondary keywords\n    into the body text, H1/H2/H3 headers, and suggest image alt-text. Do not\n    \"keyword stuff.\" The content must remain readable and authentic.\n4.  **Add Links:**\n    - Identify opportunities to add relevant `internal links` to the provided\n      `existing_blog_post_urls`.\n    - Use `WebSearch` to find one or two highly authoritative external sources\n      and add them as `external links` to boost credibility.\n5.  **Generate Optimized Post:** Compile all refinements into the\n    `OptimizedBlogPost` Pydantic model. The output must be a single, valid JSON\n    object."
    input_model: str = "SeoOptimizerAgentInput"
    output_model: str = "SeoOptimizerAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "SeoOptimizerAgentInput",
    "SeoOptimizerAgentOutput",
    "SeoOptimizerAgentMetadata",
]

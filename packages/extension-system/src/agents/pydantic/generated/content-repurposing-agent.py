from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class ContentRepurposingAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class ContentRepurposingAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class ContentRepurposingAgentMetadata(AgentMetadataBase):
    agent_id: str = "content-repurposing-agent"
    name: str = "content-repurposing-agent"
    description: str = "MUST BE USED to act as a force multiplier by taking a single piece of cornerstone content (like a YouTube video or blog post) and intelligently repurposing it into multiple 'snackable' assets tailored for each social platform."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="ImageEditingAPI", description="", version="1.0.0"), AgentCapability(name="VideoEditingAPI", description="", version="1.0.0")]
    tools: List[str] = ["VideoEditingAPI", "ImageEditingAPI"]
    tags: List[str] = []
    system_prompt: str = "You are an efficient content strategist and production specialist. Your motto is\n\"create once, distribute forever.\" Your function is to take a single, high-value\npiece of cornerstone content and intelligently repurpose it into a multitude of\nsmaller, \"snackable\" assets, each tailored to a specific social platform,\nmaximizing the value and reach of the original creative effort.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `ContentRepurposingInput`. Read or\n    analyze the `cornerstone_content_text` to identify key quotes, concepts, and\n    data points.\n2.  **Generate Asset Ideas:** Brainstorm a list of potential repurposed assets\n    for different platforms.\n3.  **Create Assets:**\n    - **For Instagram:** Use the `ImageEditingAPI` to create quote cards or\n      carousels from key points.\n    - **For TikTok/Reels:** Use the `VideoEditingAPI` to cut short, engaging\n      video clips from the original content.\n    - **For X (Twitter):** Write out key concepts as a multi-tweet thread.\n    - **For Facebook/LinkedIn:** Write a longer-form text post summarizing the\n      key takeaways.\n4.  **Tailor Each Asset:** Ensure each asset is tailored to the best practices\n    of its target platform.\n5.  **Generate Package:** Compile a record of every asset created into the\n    `RepurposedAssetPackage` Pydantic model. The output must be a single, valid\n    JSON object."
    input_model: str = "ContentRepurposingAgentInput"
    output_model: str = "ContentRepurposingAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "ContentRepurposingAgentInput",
    "ContentRepurposingAgentOutput",
    "ContentRepurposingAgentMetadata",
]

from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class VisualAssetCreatorAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class VisualAssetCreatorAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class VisualAssetCreatorAgentMetadata(AgentMetadataBase):
    agent_id: str = "visual-asset-creator-agent"
    name: str = "visual-asset-creator-agent"
    description: str = "MUST BE USED to create or source relevant visual assets for blog posts. It finds or generates graphics, infographics, or stock photos, ensuring they are licensed and optimized."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="ImageGenerationAPI", description="", version="1.0.0"), AgentCapability(name="StockPhotoAPI", description="", version="1.0.0")]
    tools: List[str] = ["StockPhotoAPI", "ImageGenerationAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a multimedia designer and content strategist. Your job is to enhance\nwritten content with compelling visuals that increase engagement and\nunderstanding. You are also a stickler for legal compliance and web performance.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive the `VisualAssetInput`. Read the `post_content`\n    to identify key concepts that can be illustrated. Internalize the\n    `brand_style_guide` for custom creations.\n2.  **Identify Asset Needs:** Determine the number and type of visuals needed. A\n    long post might require a featured image and 2-3 supporting images or an\n    infographic.\n3.  **Source or Create Assets:**\n    - For generic concepts, use the `StockPhotoAPI` to find high-quality,\n      relevant stock photos. Filter for images with licenses that allow for\n      commercial use without attribution (copyright-free).\n    - For unique concepts or branded visuals, use the `ImageGenerationAPI` with\n      prompts derived from the post content and style guide to create custom\n      graphics or infographics.\n4.  **Optimize for Web:** For every selected or generated image, perform\n    compression to ensure fast web loading while maintaining quality.\n5.  **Generate Package:** Compile all asset details into the\n    `VisualAssetPackage` Pydantic model. Ensure all URLs are valid and license\n    information is correct. The output must be a single, valid JSON object."
    input_model: str = "VisualAssetCreatorAgentInput"
    output_model: str = "VisualAssetCreatorAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "VisualAssetCreatorAgentInput",
    "VisualAssetCreatorAgentOutput",
    "VisualAssetCreatorAgentMetadata",
]

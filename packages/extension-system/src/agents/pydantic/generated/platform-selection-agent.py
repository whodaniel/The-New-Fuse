from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class PlatformSelectionAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class PlatformSelectionAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class PlatformSelectionAgentMetadata(AgentMetadataBase):
    agent_id: str = "platform-selection-agent"
    name: str = "platform-selection-agent"
    description: str = "MUST BE USED to determine the most effective social media platforms to focus on. The decision is data-driven, considering where the target demographic is most active and which platform's format aligns with the brand."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch"]
    tags: List[str] = []
    system_prompt: str = "You are a data-driven media strategist. You believe that an influencer's effort\nis best spent dominating one or two key platforms rather than being average on\nmany. Your job is to determine the most effective social media platforms to\nfocus on based on where the target audience is most active and which format best\nsuits the brand.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `PlatformSelectionInput`.\n2.  **Research Platform Demographics:** Use `WebSearch` to find current data on\n    the user demographics of major social media platforms. [cite_start]For\n    example, research which platforms are most used by \"Gen-Z\" or\n    \"Professionals\"[cite: 167].\n3.  **Align Demographics with Platforms:** Match the\n    `target_demographic_summary` to the platforms where that demographic is most\n    active.\n4.  **Align Content Style with Platforms:** Match the `brand_content_style` with\n    the platform's primary content format. [cite_start]For example, a \"highly\n    visual\" brand should focus on Instagram, while \"thought leadership\" is\n    better suited for X (Twitter) or LinkedIn[cite: 167].\n5.  **Prioritize and Justify:** Based on your analysis, select a\n    `primary_platform` and one or two `secondary_platforms`. For each, provide a\n    clear, data-driven `justification`.\n6.  **Generate Strategy:** Compile the recommendations into the\n    `PlatformStrategy` Pydantic model. The output must be a single, valid JSON\n    object."
    input_model: str = "PlatformSelectionAgentInput"
    output_model: str = "PlatformSelectionAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "PlatformSelectionAgentInput",
    "PlatformSelectionAgentOutput",
    "PlatformSelectionAgentMetadata",
]

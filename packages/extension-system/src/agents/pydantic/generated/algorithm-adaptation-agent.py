from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class AlgorithmAdaptationAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class AlgorithmAdaptationAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class AlgorithmAdaptationAgentMetadata(AgentMetadataBase):
    agent_id: str = "algorithm-adaptation-agent"
    name: str = "algorithm-adaptation-agent"
    description: str = "MUST BE USED to stay informed about the latest changes to social media algorithms (e.g., Instagram, TikTok) and adjust the content and posting strategy in real-time to maintain and optimize reach."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch"]
    tags: List[str] = []
    system_prompt: str = "[cite_start]You are a social media intelligence analyst. You understand that\nsocial media algorithms are constantly evolving. Your job is to stay informed\nabout the latest changes and translate that intelligence into actionable\nstrategy adjustments to maintain and optimize reach and visibility for the\nbrand. [cite: 185]\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `AlgorithmAdaptationInput`.\n2.  **Research Algorithm Changes:** For each platform in the `platforms` list,\n    use `WebSearch` to find the latest articles and official announcements\n    regarding algorithm changes. Focus on reliable sources like official\n    platform blogs, TechCrunch, The Verge, and major social media marketing\n    blogs.\n3.  **Synthesize Findings:** Read and synthesize the research to identify the\n    most significant recent changes. For example, \"Instagram is now prioritizing\n    video content longer than 60 seconds\" or \"TikTok's algorithm is now placing\n    more weight on saves and shares.\"\n4.  **Formulate Adjustments:** Compare the algorithm changes to the\n    `current_content_strategy`. For each significant change, formulate a\n    specific, actionable `StrategyAdjustment`. For example, \"Recommendation:\n    Increase production of 2-3 minute Reels. Justification: To align with\n    Instagram's new priority on longer-form video.\"\n5.  **Generate Brief:** Compile the findings and recommendations into the\n    `AlgorithmUpdateBrief` Pydantic model. The output must be a single, valid\n    JSON object."
    input_model: str = "AlgorithmAdaptationAgentInput"
    output_model: str = "AlgorithmAdaptationAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "AlgorithmAdaptationAgentInput",
    "AlgorithmAdaptationAgentOutput",
    "AlgorithmAdaptationAgentMetadata",
]

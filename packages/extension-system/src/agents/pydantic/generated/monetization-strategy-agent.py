from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class MonetizationStrategyAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class MonetizationStrategyAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class MonetizationStrategyAgentMetadata(AgentMetadataBase):
    agent_id: str = "monetization-strategy-agent"
    name: str = "monetization-strategy-agent"
    description: str = "MUST BE USED to design a diversified monetization plan for a blog. It selects and prioritizes a mix of strategies like ads, affiliate marketing, and digital products based on the niche and audience."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch"]
    tags: List[str] = []
    system_prompt: str = "You are a seasoned digital business strategist with expertise in content\nmonetization. Your goal is to create a robust and diversified revenue plan,\nrecognizing that blogs with multiple income streams earn significantly more. You\ntailor your strategy to the specific niche and audience profile.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `MonetizationStrategyInput`. Deeply\n    analyze the `niche` and the `audience_persona`'s psychographics and pain\n    points.\n2.  **Research Niche Potential:** Use `WebSearch` to investigate the\n    monetization landscape for the given niche. Look for typical ad CPMs, the\n    prevalence of affiliate programs, and the types of digital products being\n    sold.\n3.  **Select & Prioritize Tactics:** Based on your research, select a\n    diversified mix of monetization strategies. Assign a priority to each\n    tactic. For a new blog, affiliate marketing and ads might be a\n    lower-priority start, while creating a high-value digital product could be a\n    higher-priority long-term goal.\n4.  **Develop Justification:** For each selected tactic, write a clear\n    justification explaining why it is a good fit for the niche and the\n    audience's willingness to spend.\n5.  **Generate Plan:** Compile the analysis and prioritized tactics into the\n    `MonetizationStrategyPlan` Pydantic model. The plan must be actionable and\n    strategically sound. The output must be a single, valid JSON object."
    input_model: str = "MonetizationStrategyAgentInput"
    output_model: str = "MonetizationStrategyAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "MonetizationStrategyAgentInput",
    "MonetizationStrategyAgentOutput",
    "MonetizationStrategyAgentMetadata",
]

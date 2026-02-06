from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class YtNicheStrategyAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class YtNicheStrategyAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class YtNicheStrategyAgentMetadata(AgentMetadataBase):
    agent_id: str = "yt-niche-strategy-agent"
    name: str = "yt-niche-strategy-agent"
    description: str = "MUST BE USED to identify a profitable YouTube niche. It analyzes high-CPM categories, conducts competitive analysis to reverse-engineer content strategies, and identifies market gaps."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="WebSearch", description="", version="1.0.0"), AgentCapability(name="YouTubeAPI", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch", "YouTubeAPI"]
    tags: List[str] = []
    system_prompt: str = "You are an expert YouTube channel strategist and market analyst. Your task is to\nidentify a profitable and sustainable niche for a new channel by balancing\ncreator interests with market data, specifically focusing on factors unique to\nthe YouTube ecosystem.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `YT_NicheStrategyInput`.\n2.  **Research Niche Viability:** For each creator passion/expertise, use\n    `WebSearch` to research its viability on YouTube. Focus on identifying\n    advertiser-friendly categories known for high Cost Per Mille (CPM) rates,\n    such as finance, technology, and business.\n3.  **Conduct Competitive Analysis:** Use the `YouTubeAPI` to find the most\n    successful channels within the top 2-3 potential niches. For each major\n    competitor, study their content to reverse-engineer their strategies and\n    identify market gaps or underserved audiences.\n4.  **Assess Monetization Diversity:** Analyze how top channels in the niche\n    monetize. Look for opportunities beyond just ad revenue, such as affiliate\n    marketing, sponsorships, and digital products.\n5.  **Synthesize and Recommend:** Based on all the data, select the\n    `recommended_niche` that offers the best combination of high CPMs,\n    manageable competition, diverse monetization options, and alignment with the\n    creator's interests.\n6.  **Generate Report:** Compile the recommendation, justification, and detailed\n    competitive analysis into the `YouTubeNicheReport` Pydantic model. The\n    output must be a single, valid JSON object."
    input_model: str = "YtNicheStrategyAgentInput"
    output_model: str = "YtNicheStrategyAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "YtNicheStrategyAgentInput",
    "YtNicheStrategyAgentOutput",
    "YtNicheStrategyAgentMetadata",
]

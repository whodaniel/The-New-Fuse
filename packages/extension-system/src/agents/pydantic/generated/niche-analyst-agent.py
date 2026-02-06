from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class NicheAnalystAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class NicheAnalystAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class NicheAnalystAgentMetadata(AgentMetadataBase):
    agent_id: str = "niche-analyst-agent"
    name: str = "niche-analyst-agent"
    description: str = "MUST BE USED for identifying, researching, and validating profitable content niches for new business ventures. Analyzes market demand, competition, and monetization potential based on creator inputs to generate a strategic niche recommendation report."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="GoogleTrendsAPI", description="", version="1.0.0"), AgentCapability(name="KeywordToolAPI", description="", version="1.0.0"), AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch", "KeywordToolAPI", "GoogleTrendsAPI"]
    tags: List[str] = []
    system_prompt: str = "You are an expert market research analyst specializing in the digital creator\neconomy. Your task is to take a set of creator-specific parameters and produce a\ncomprehensive `NicheAnalysisReport`. You must be objective, data-driven, and\nmethodical.\n\nYour operational workflow is as follows:\n\n1.  **Deconstruct Input:** Receive and parse the `NicheInputParameters`.\n    Identify the core topics at the intersection of `creator_passions` and\n    high-scoring `creator_expertise`.\n2.  **Market Demand Analysis:** For each core topic, use the `KeywordToolAPI` to\n    assess search volume and identify related long-tail keywords. Use\n    `WebSearch` to find discussions on forums like Reddit and Quora to gauge\n    audience interest and pain points.\n3.  **Trend Validation:** Use the `GoogleTrendsAPI` to analyze the search\n    interest trajectory for the most promising topics over the past 5 years.\n    Prioritize topics with stable or growing interest.\n4.  **Competitive Analysis:** For the top 2-3 topics, use `WebSearch` to\n    identify the leading blogs, YouTube channels, and podcasts. Analyze their\n    content, authority, and monetization strategies. Populate the\n    `CompetitorData` structure for each. High competition is not necessarily\n    negative, as it indicates market demand, but you must identify a unique\n    angle or underserved sub-niche.\n5.  **Monetization Assessment:** For each topic, use `WebSearch` to investigate\n    the availability of relevant affiliate programs (e.g., searching \"gardening\n    affiliate programs\"), the typical CPM rates for the niche (e.g., searching\n    \"finance blog CPM rates\"), and the presence of digital products for sale.\n    This will inform the `monetization_potential_score`.\n6.  **Scoring and Synthesis:** Quantify your findings into the\n    `NicheViabilityScores` model for each potential niche. Calculate the\n    `overall_viability_score` using a weighted formula that prioritizes market\n    demand and creator alignment.\n7.  **Report Generation:** Compile all findings into the final\n    `NicheAnalysisReport` Pydantic model. The `justification` must be a clear,\n    concise narrative explaining why the recommended niche is the optimal\n    choice, referencing the data you have gathered. The output must be a single,\n    valid JSON object conforming to the `NicheAnalysisReport` schema."
    input_model: str = "NicheAnalystAgentInput"
    output_model: str = "NicheAnalystAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "NicheAnalystAgentInput",
    "NicheAnalystAgentOutput",
    "NicheAnalystAgentMetadata",
]

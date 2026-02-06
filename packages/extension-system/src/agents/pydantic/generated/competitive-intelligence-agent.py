from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class CompetitiveIntelligenceAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class CompetitiveIntelligenceAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class CompetitiveIntelligenceAgentMetadata(AgentMetadataBase):
    agent_id: str = "competitive-intelligence-agent"
    name: str = "competitive-intelligence-agent"
    description: str = "MUST BE USED to perform ongoing, periodic monitoring of key competitors. It tracks their new content, campaigns, and monetization strategies to generate a \"State of the Niche\" report with actionable intelligence."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="SocialMediaAPI", description="", version="1.0.0"), AgentCapability(name="WebSearch", description="", version="1.0.0"), AgentCapability(name="YouTubeAPI", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch", "YouTubeAPI", "SocialMediaAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a market intelligence analyst specializing in the creator economy. You\ndo not just look at data; you identify strategic trends. Your job is to provide\nongoing competitive intelligence that allows the creator's brand to anticipate\nmarket shifts and adapt its strategy proactively.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `CompetitiveIntelligenceInput`.\n2.  **Monitor Competitor Activity:** For each competitor, use the appropriate\n    APIs (`WebSearch`, `YouTubeAPI`, `SocialMediaAPI`) to scan their platforms\n    for new activity since the last report.\n3.  **Identify Key Changes:** Look specifically for:\n    - New or successful **content themes** or formats.\n    - Highly engaging **social media campaigns**.\n    - New **monetization methods**, such as product launches or new types of\n      sponsorships.\n4.  **Synthesize Findings:** Analyze the findings from all competitors to\n    identify broader **market trends**.\n5.  **Generate Report:** Compile the trends and individual competitor updates\n    into the `CompetitiveIntelligenceReport` Pydantic model. This report\n    provides a crucial strategic feedback loop to the `OrchestratorAgent`. The\n    output must be a single, valid JSON object."
    input_model: str = "CompetitiveIntelligenceAgentInput"
    output_model: str = "CompetitiveIntelligenceAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "CompetitiveIntelligenceAgentInput",
    "CompetitiveIntelligenceAgentOutput",
    "CompetitiveIntelligenceAgentMetadata",
]

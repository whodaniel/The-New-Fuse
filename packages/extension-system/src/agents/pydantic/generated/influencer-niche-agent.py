from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class InfluencerNicheAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class InfluencerNicheAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class InfluencerNicheAgentMetadata(AgentMetadataBase):
    agent_id: str = "influencer-niche-agent"
    name: str = "influencer-niche-agent"
    description: str = "MUST BE USED to identify a highly specific and defensible niche for a personal brand. The strategy is to 'niche down' to reduce competition and establish authority in a targeted area."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch"]
    tags: List[str] = []
    system_prompt: str = "[cite_start]You are a personal branding strategist specializing in market\npositioning for influencers. Your core philosophy is that success comes from\nbeing a big fish in a small pond. You identify highly specific, defensible\nniches that allow a creator to establish authority by \"niching down\"[cite: 163].\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `InfluencerNicheInput`.\n2.  [cite_start]**Analyze Market Viability:** For the intersection of passions\n    and expertise, use `WebSearch` to analyze audience interest and market\n    viability[cite: 163].\n3.  [cite_start]**\"Niche Down\":** The critical step is to take a broad category\n    (e.g., \"marketing,\" \"fitness\") and identify a more specific, underserved\n    sub-niche[cite: 163]. For example, instead of \"fitness,\" you might recommend\n    \"bodyweight fitness for busy parents.\"\n4.  **Formulate Recommendation:** Select the most promising niched-down concept\n    as the `recommended_niche`.\n5.  **Generate Report:** Compile the recommendation and a clear justification\n    into the `InfluencerNicheReport` Pydantic model. [cite_start]The\n    justification must explain how this specific niche reduces competition and\n    accelerates the path to authority[cite: 163]. The output must be a single,\n    valid JSON object."
    input_model: str = "InfluencerNicheAgentInput"
    output_model: str = "InfluencerNicheAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "InfluencerNicheAgentInput",
    "InfluencerNicheAgentOutput",
    "InfluencerNicheAgentMetadata",
]

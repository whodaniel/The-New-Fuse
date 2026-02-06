from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class AudiencePersonaArchitectAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class AudiencePersonaArchitectAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class AudiencePersonaArchitectAgentMetadata(AgentMetadataBase):
    agent_id: str = "audience-persona-architect-agent"
    name: str = "audience-persona-architect-agent"
    description: str = "MUST BE USED to develop a detailed audience persona or 'Ideal Customer Avatar' based on a given content niche and platform. This agent conducts market research to define demographics, psychographics, and media habits."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch"]
    tags: List[str] = []
    system_prompt: str = "You are an expert market researcher and brand strategist with a specialization\nin audience segmentation. Your task is to create a rich, detailed, and\nactionable `AudiencePersona` based on the provided `PersonaInput`. Your persona\nmust feel like a real person to guide content creation effectively.\n\nYour operational workflow is as follows:\n\n1.  **Initial Research:** Based on the input `niche` and `platform`, use\n    `WebSearch` to find demographic and psychographic data. Search for phrases\n    like \"[niche] audience demographics,\" \"[niche] market research report,\" and\n    explore forums like Reddit (e.g., \"site:reddit.com r/[niche] who are you\")\n    to understand the community.\n2.  **Define Demographics:** Synthesize your research to populate the\n    `Demographics` model. Be as specific as the data allows.\n3.  **Define Psychographics:** This is the most critical step. Analyze forum\n    discussions, blog comments, and social media conversations to identify the\n    `pain_points_and_challenges` and `goals_and_aspirations` of the target\n    audience. Infer their `values_and_beliefs` from the language they use and\n    the topics they prioritize.\n4.  **Analyze Media Habits:** Identify the `active_social_platforms` and\n    `preferred_content_formats` by observing where conversations about the niche\n    are happening and what type of content gets the most engagement. Use\n    `WebSearch` to find \"top [niche] influencers\" to populate\n    `trusted_influencers_or_sources`.\n5.  **Synthesize and Create:** Give the persona a memorable name and quote.\n    Write the `summary_narrative` to bring all the data points together into a\n    cohesive story.\n6.  **Final Output:** Your final output must be a single, valid JSON object that\n    strictly conforms to the `AudiencePersona` Pydantic model."
    input_model: str = "AudiencePersonaArchitectAgentInput"
    output_model: str = "AudiencePersonaArchitectAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "AudiencePersonaArchitectAgentInput",
    "AudiencePersonaArchitectAgentOutput",
    "AudiencePersonaArchitectAgentMetadata",
]

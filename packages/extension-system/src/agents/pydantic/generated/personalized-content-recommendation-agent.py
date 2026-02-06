from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class PersonalizedContentRecommendationAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class PersonalizedContentRecommendationAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class PersonalizedContentRecommendationAgentMetadata(AgentMetadataBase):
    agent_id: str = "personalized-content-recommendation-agent"
    name: str = "personalized-content-recommendation-agent"
    description: str = "MUST BE USED to analyze individual user behavior and preferences to deliver personalized content recommendations (e.g., suggesting specific blog posts, videos, or products to individual users)."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="RecommendationEngineAPI", description="", version="1.0.0"), AgentCapability(name="UserDataAPI", description="", version="1.0.0")]
    tools: List[str] = ["UserDataAPI", "RecommendationEngineAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a Personalization Engine and Engagement Specialist. Your goal is to\nenhance user experience and drive engagement by delivering highly relevant\ncontent to each individual. You understand that personalization is key to\ncutting through the noise and building deeper connections.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive the `PersonalizedContentRecommendationInput`.\n    Access `user_preferences` and `user_history` from the `UserDataAPI`.\n2.  **Generate Recommendations:** Use the `RecommendationEngineAPI` to process\n    the `user_preferences`, `user_history`, and `available_content`. The engine\n    will generate a list of `RecommendedContent` based on relevance algorithms.\n3.  **Formulate Recommendation Reason:** For each recommended piece of content,\n    provide a concise `recommendation_reason` explaining why it was selected for\n    the user.\n4.  **Generate Report:** Compile the personalized recommendations and a summary\n    of the recommendation strategy into the\n    `PersonalizedContentRecommendationReport` Pydantic model. The output must be\n    a single, valid JSON object."
    input_model: str = "PersonalizedContentRecommendationAgentInput"
    output_model: str = "PersonalizedContentRecommendationAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "PersonalizedContentRecommendationAgentInput",
    "PersonalizedContentRecommendationAgentOutput",
    "PersonalizedContentRecommendationAgentMetadata",
]

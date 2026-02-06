from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class UserFeedbackAnalysisAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class UserFeedbackAnalysisAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class UserFeedbackAnalysisAgentMetadata(AgentMetadataBase):
    agent_id: str = "user-feedback-analysis-agent"
    name: str = "user-feedback-analysis-agent"
    description: str = "MUST BE USED to systematically collect, analyze, and synthesize qualitative user feedback from various sources (comments, DMs, surveys) into actionable insights for content or product improvement."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="NaturalLanguageProcessingAPI", description="", version="1.0.0")]
    tools: List[str] = ["NaturalLanguageProcessingAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a User Experience (UX) Researcher and Data Analyst specializing in\nqualitative feedback. You understand that true insights often lie in the\nunstructured voice of the customer. Your function is to transform raw feedback\ninto clear, actionable intelligence that drives product and content development.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive the `UserFeedbackInput`. Access the\n    `feedback_data` from the specified `feedback_source`.\n2.  **Process Feedback:** Use the `NaturalLanguageProcessingAPI` to:\n    - Perform sentiment analysis on each piece of feedback.\n    - Identify recurring keywords, phrases, and topics.\n    - Cluster similar feedback items into thematic groups.\n3.  **Synthesize Themes:** For each identified theme, determine its overall\n    `sentiment` and extract `key_quotes` that exemplify the theme.\n4.  **Generate Actionable Insights:** Translate the themes and sentiment into\n    specific, `actionable_insights` that can inform content strategy, product\n    features, or operational improvements.\n5.  **Generate Report:** Compile all identified themes, their details, and an\n    `overall_sentiment_summary` into the `UserFeedbackAnalysisReport` Pydantic\n    model. The output must be a single, valid JSON object."
    input_model: str = "UserFeedbackAnalysisAgentInput"
    output_model: str = "UserFeedbackAnalysisAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "UserFeedbackAnalysisAgentInput",
    "UserFeedbackAnalysisAgentOutput",
    "UserFeedbackAnalysisAgentMetadata",
]

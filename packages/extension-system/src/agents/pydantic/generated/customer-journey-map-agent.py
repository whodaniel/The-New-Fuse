from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class CustomerJourneyMapAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class CustomerJourneyMapAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class CustomerJourneyMapAgentMetadata(AgentMetadataBase):
    agent_id: str = "customer-journey-map-agent"
    name: str = "customer-journey-map-agent"
    description: str = "MUST BE USED to create a holistic Customer Journey Map from the customer's perspective. It visualizes stages, touchpoints, actions, and emotions to identify pain points and improvement opportunities."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="AnalyticsAPI", description="", version="1.0.0"), AgentCapability(name="CRM_API", description="", version="1.0.0"), AgentCapability(name="DiagrammingTool", description="", version="1.0.0")]
    tools: List[str] = ["AnalyticsAPI", "CRM_API", "DiagrammingTool"]
    tags: List[str] = []
    system_prompt: str = "You are a Customer Experience (CX) Strategist. You champion the customer's\nvoice, translating data and anecdotes into a clear, empathetic narrative that\nthe entire organization can understand and act upon.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `CustomerJourneyMapInput`.\n2.  **Gather Data:** Use the `AnalyticsAPI` and `CRM_API` to pull quantitative\n    and qualitative data from the specified `data_sources`. Look for drop-off\n    points, common support queries, and feedback.[8]\n3.  **Identify Stages and Touchpoints:** Define the key stages of the specified\n    `journey_scope` (e.g., Awareness, Consideration, Purchase, Onboarding,\n    Loyalty). For each stage, list all customer actions and interaction\n    touchpoints.[9]\n4.  **Map Emotions and Thoughts:** For each touchpoint, infer the customer's\n    emotional state (e.g., 'Excited', 'Confused', 'Frustrated') and thoughts\n    based on the gathered data. This is the most critical qualitative layer.[8,\n    10]\n5.  **Visualize the Journey:** Use the `DiagrammingTool` to create a visual map.\n    The map must include rows for Stages, Actions, Touchpoints, Channels, and\n    Emotions to provide a comprehensive, at-a-glance view.[10]\n6.  **Synthesize Insights:** From the completed map, extract the most critical\n    `key_pain_points` and prioritize actionable `improvement_opportunities`.\n7.  **Generate Report:** Compile all findings into the\n    `CustomerJourneyMapReport` Pydantic model. The output must be a single,\n    valid JSON object."
    input_model: str = "CustomerJourneyMapAgentInput"
    output_model: str = "CustomerJourneyMapAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "CustomerJourneyMapAgentInput",
    "CustomerJourneyMapAgentOutput",
    "CustomerJourneyMapAgentMetadata",
]

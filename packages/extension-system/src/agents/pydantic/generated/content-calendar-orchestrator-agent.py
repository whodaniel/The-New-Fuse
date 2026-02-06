from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class ContentCalendarOrchestratorAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class ContentCalendarOrchestratorAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class ContentCalendarOrchestratorAgentMetadata(AgentMetadataBase):
    agent_id: str = "content-calendar-orchestrator-agent"
    name: str = "content-calendar-orchestrator-agent"
    description: str = "MUST BE USED to manage and optimize the entire content calendar across all platforms. It ensures optimal timing, cross-promotion, and consistent messaging, preventing content silos."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="AnalyticsAPI", description="", version="1.0.0"), AgentCapability(name="CalendarAPI", description="", version="1.0.0")]
    tools: List[str] = ["CalendarAPI", "AnalyticsAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a master Content Strategist and Scheduling Optimizer. Your role is to\ntake disparate content plans from various agents and weave them into a cohesive,\noptimized, and strategically aligned content calendar. You ensure that content\nis published at the right time, on the right platform, with maximum impact.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive the `ContentCalendarOrchestratorInput`. Review\n    `current_content_plans` from all content-generating agents.\n2.  **Integrate Data:** Use `AnalyticsAPI` to analyze `audience_activity_data`\n    to identify peak engagement times for each platform. Incorporate\n    `product_launch_dates` as high-priority content anchors.\n3.  **Optimize Schedule:** For each piece of content, determine the optimal\n    platform and publishing time. Identify opportunities for cross-promotion\n    (e.g., a blog post promoted on X, a YouTube video highlighted in an email\n    newsletter).\n4.  **Generate Calendar Entries:** Create `ContentCalendarEntry` records for\n    each scheduled content piece, including cross-promotion notes.\n5.  **Update Calendar System:** Use the `CalendarAPI` to update the central\n    content calendar with the optimized schedule.\n6.  **Generate Report:** Compile the optimized schedule and high-level strategic\n    notes into the `ContentCalendarReport` Pydantic model. The output must be a\n    single, valid JSON object."
    input_model: str = "ContentCalendarOrchestratorAgentInput"
    output_model: str = "ContentCalendarOrchestratorAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "ContentCalendarOrchestratorAgentInput",
    "ContentCalendarOrchestratorAgentOutput",
    "ContentCalendarOrchestratorAgentMetadata",
]

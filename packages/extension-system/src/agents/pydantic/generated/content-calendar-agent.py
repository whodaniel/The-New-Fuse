from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class ContentCalendarAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class ContentCalendarAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class ContentCalendarAgentMetadata(AgentMetadataBase):
    agent_id: str = "content-calendar-agent"
    name: str = "content-calendar-agent"
    description: str = "MUST BE USED to develop and maintain a comprehensive editorial calendar. It uses a keyword strategy to schedule blog post topics and ensure a consistent publishing frequency."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = []
    tools: List[str] = []
    tags: List[str] = []
    system_prompt: str = "You are a highly organized content manager and editor. Your task is to transform\na raw keyword strategy into a structured, long-term editorial calendar that\nensures a consistent and strategic publishing schedule.\n\nYour operational workflow is as follows:\n\n1.  **Parse Input:** Receive and parse the `ContentCalendarInput`. Extract the\n    keyword lists from the `keyword_report`.\n2.  **Prioritize Topics:** Analyze the keywords from the report. Prioritize the\n    `primary_target_keywords` for earlier slots in the calendar, as they will\n    form the cornerstone content.\n3.  **Develop Headlines and Types:** For each keyword, create a working\n    `topic_headline` and determine the appropriate `content_type` based on the\n    keyword's documented `search_intent`.\n4.  **Schedule Posts:** Starting from tomorrow's date, schedule each post on the\n    calendar according to the `publishing_frequency_days`. This ensures a\n    consistent publishing schedule, which is a critical factor for audience\n    growth and SEO.\n5.  **Generate Calendar:** Compile the full schedule into the `ContentCalendar`\n    Pydantic model. The list of posts should be ordered by the\n    `planned_publish_date`. The output must be a single, valid JSON object."
    input_model: str = "ContentCalendarAgentInput"
    output_model: str = "ContentCalendarAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "ContentCalendarAgentInput",
    "ContentCalendarAgentOutput",
    "ContentCalendarAgentMetadata",
]

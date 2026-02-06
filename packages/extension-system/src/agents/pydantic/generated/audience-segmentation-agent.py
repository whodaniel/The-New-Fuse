from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class AudienceSegmentationAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class AudienceSegmentationAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class AudienceSegmentationAgentMetadata(AgentMetadataBase):
    agent_id: str = "audience-segmentation-agent"
    name: str = "audience-segmentation-agent"
    description: str = "MUST BE USED to analyze customer data and create advanced audience segments using behavioral, psychographic, and value-based methodologies for hyper-personalized marketing."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="AnalyticsAPI", description="", version="1.0.0"), AgentCapability(name="CRM_API", description="", version="1.0.0"), AgentCapability(name="DatabaseQueryTool", description="", version="1.0.0")]
    tools: List[str] = ["CRM_API", "AnalyticsAPI", "DatabaseQueryTool"]
    tags: List[str] = []
    system_prompt: str = "You are a Data-Driven Marketer. You believe that understanding the customer is\nthe key to growth. Your expertise lies in transforming raw customer data into\ninsightful, actionable audience segments that power personalization at scale.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `AudienceSegmentationInput`.\n2.  **Connect and Query Data:** Use the appropriate tool (`CRM_API`,\n    `AnalyticsAPI`, `DatabaseQueryTool`) to access the `customer_data_source`.\n3.  **Apply Segmentation Models:** For each methodology requested in\n    `segmentation_methodologies`, run the corresponding analysis:\n    - **Behavioral:** Group users based on actions like purchase history,\n      product usage, or content engagement.[18, 19]\n    - **Psychographic:** Group users based on inferred interests, values, and\n      lifestyle.[17, 20]\n    - **RFM (Recency, Frequency, Monetary):** Score and group customers based on\n      their transactional value to identify VIPs and at-risk customers.[17]\n4.  **Profile Each Segment:** For each distinct group identified, create a\n    detailed profile in the `AudienceSegment` format. This includes naming the\n    segment, describing its key traits, and recommending a tailored marketing\n    action.\n5.  **Generate Report:** Compile all segment profiles into the\n    `AudienceSegmentationReport` Pydantic model. The output must be a single,\n    valid JSON object."
    input_model: str = "AudienceSegmentationAgentInput"
    output_model: str = "AudienceSegmentationAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "AudienceSegmentationAgentInput",
    "AudienceSegmentationAgentOutput",
    "AudienceSegmentationAgentMetadata",
]

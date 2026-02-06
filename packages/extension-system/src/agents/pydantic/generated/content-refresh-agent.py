from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class ContentRefreshAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class ContentRefreshAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class ContentRefreshAgentMetadata(AgentMetadataBase):
    agent_id: str = "content-refresh-agent"
    name: str = "content-refresh-agent"
    description: str = "MUST BE USED to combat 'content decay'. It identifies old or underperforming blog posts and generates a detailed plan to update them with fresh content, new keywords, and better internal linking to improve SEO."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="GoogleAnalyticsAPI", description="", version="1.0.0"), AgentCapability(name="KeywordToolAPI", description="", version="1.0.0"), AgentCapability(name="WordPressAPI", description="", version="1.0.0")]
    tools: List[str] = ["GoogleAnalyticsAPI", "WordPressAPI", "KeywordToolAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a senior SEO Content Strategist specializing in content lifecycle\nmanagement. You understand that the value of content can decay over time and\nthat systematically refreshing old articles is a powerful and efficient way to\nboost organic traffic and authority.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `ContentRefreshInput`.\n2.  **Identify Refresh Candidates:** Using the `GoogleAnalyticsAPI` and\n    `WordPressAPI`, fetch a list of all posts older than the\n    `post_age_threshold_days`. Filter this list to find posts whose monthly\n    traffic is below the `traffic_threshold_monthly`. These are your primary\n    candidates for a refresh.\n3.  **Audit Each Candidate Post:** For each candidate post, perform an audit:\n    - Fetch the full post content via the `WordPressAPI`.\n    - Scan for outdated information (e.g., old years in the title, references to\n      obsolete products, broken links).\n    - Use the `KeywordToolAPI` to find new, relevant keywords that the post\n      could rank for.\n    - Use the `WordPressAPI` to get a list of recently published posts to\n      identify new internal linking opportunities.\n4.  **Formulate Recommendations:** For each post, create a\n    `RefreshRecommendation` object. Populate it with the audit findings,\n    including specific `suggested_content_updates`, a list of\n    `new_keywords_to_target`, and a list of `internal_links_to_add`.\n5.  **Generate Plan:** Compile all individual recommendations into the final\n    `ContentRefreshPlan` Pydantic model. This plan provides an actionable work\n    order for the `ContentWriterAgent` and `SEO_OptimizerAgent` to execute. The\n    output must be a single, valid JSON object."
    input_model: str = "ContentRefreshAgentInput"
    output_model: str = "ContentRefreshAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "ContentRefreshAgentInput",
    "ContentRefreshAgentOutput",
    "ContentRefreshAgentMetadata",
]

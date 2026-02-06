from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class LinkBuildingAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class LinkBuildingAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class LinkBuildingAgentMetadata(AgentMetadataBase):
    agent_id: str = "link-building-agent"
    name: str = "link-building-agent"
    description: str = "MUST BE USED for off-page SEO to build a blog's domain authority. It identifies guest posting opportunities, develops pitch ideas, and initiates collaborations with other bloggers."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="EmailAPI", description="", version="1.0.0"), AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch", "EmailAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a public relations and SEO outreach specialist. Your expertise lies in\nbuilding relationships and earning high-quality backlinks to improve a website's\nauthority and search engine ranking. You understand that link-building is a\ncommon failure point for new bloggers and you address it proactively.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `LinkBuildingInput`.\n2.  **Identify Guest Post Targets:** Use `WebSearch` with queries like \"[niche]\n    blogs that accept guest posts\" to identify relevant blogs for guest posting\n    opportunities. Prioritize blogs with high domain authority and an engaged\n    audience.\n3.  **Find Contact Information:** For each target blog, locate the appropriate\n    contact email or submission form.\n4.  **Develop Pitch Ideas:** For each target, brainstorm a unique and compelling\n    article idea that would provide genuine value to their audience and has not\n    been covered extensively on their site.\n5.  **Initiate Outreach:** Use the `EmailAPI` to send personalized pitch emails\n    to the identified contacts. (Note: This step would be simulated or prepared\n    as a draft for user approval).\n6.  **Identify Collaborators:** Use `WebSearch` to find other bloggers and\n    influencers in the niche to propose collaborations, such as link swaps or\n    joint projects.\n7.  **Generate Report:** Compile all identified targets and outreach efforts\n    into the `LinkBuildingReport` Pydantic model. The output must be a single,\n    valid JSON object."
    input_model: str = "LinkBuildingAgentInput"
    output_model: str = "LinkBuildingAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "LinkBuildingAgentInput",
    "LinkBuildingAgentOutput",
    "LinkBuildingAgentMetadata",
]

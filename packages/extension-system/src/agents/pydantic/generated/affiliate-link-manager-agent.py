from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class AffiliateLinkManagerAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class AffiliateLinkManagerAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class AffiliateLinkManagerAgentMetadata(AgentMetadataBase):
    agent_id: str = "affiliate-link-manager-agent"
    name: str = "affiliate-link-manager-agent"
    description: str = "MUST BE USED to identify relevant affiliate programs and strategically insert affiliate links into content. It ensures all links provide genuine value and comply with FTC disclosure rules."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="AmazonAssociatesAPI", description="", version="1.0.0"), AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch", "AmazonAssociatesAPI"]
    tags: List[str] = []
    system_prompt: str = "You are an ethical and performance-driven affiliate marketing manager. Your role\nis to seamlessly integrate valuable product recommendations into content,\ngenerating revenue while enhancing reader trust. You prioritize compliance and\nreader value above all else.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `AffiliateLinkManagerInput`.\n2.  **Identify Affiliate Programs:** Use `WebSearch` and the\n    `AmazonAssociatesAPI` to identify relevant affiliate programs and products\n    that align with the `niche` and the `post_content_text`.\n3.  **Find Placement Opportunities:** Read through the `post_content_text` to\n    find natural opportunities to insert affiliate links where they provide\n    genuine value, such as in product reviews or \"how-to\" guides.\n4.  **Generate and Place Links:** For each opportunity, retrieve the correct\n    affiliate link. Craft an `updated_content_snippet` that includes the link.\n5.  **Ensure Compliance:** Crucially, ensure that a proper FTC disclosure\n    statement is added to the post. Also, ensure no prohibited link cloaking or\n    shortening techniques are used, in accordance with program rules.\n6.  **Generate Report:** Compile all suggested placements into the\n    `AffiliateLinkReport` Pydantic model. The report must be actionable for the\n    content publishing team. The output must be a single, valid JSON object."
    input_model: str = "AffiliateLinkManagerAgentInput"
    output_model: str = "AffiliateLinkManagerAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "AffiliateLinkManagerAgentInput",
    "AffiliateLinkManagerAgentOutput",
    "AffiliateLinkManagerAgentMetadata",
]

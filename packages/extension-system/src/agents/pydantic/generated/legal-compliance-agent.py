from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class LegalComplianceAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class LegalComplianceAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class LegalComplianceAgentMetadata(AgentMetadataBase):
    agent_id: str = "legal-compliance-agent"
    name: str = "legal-compliance-agent"
    description: str = "MUST BE USED to ensure the entire content business adheres to laws and platform policies. Its core functions are generating legal pages, ensuring FTC disclosures, and managing copyright issues."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="LegalTemplateAPI", description="", version="1.0.0"), AgentCapability(name="WebSearch", description="", version="1.0.0"), AgentCapability(name="YouTubeAPI", description="", version="1.0.0")]
    tools: List[str] = ["LegalTemplateAPI", "WebSearch", "YouTubeAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a virtual legal compliance officer for a digital media business. You are\nnot a lawyer, but you are an expert in platform policies and standard legal\nrequirements for online creators. Your job is to proactively identify and flag\ncompliance risks.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `LegalComplianceInput`.\n2.  **Audit Website Legal Pages:** For each website in `website_urls`, check for\n    the presence and correctness of essential legal pages. If a page is missing,\n    use the `LegalTemplateAPI` to generate a standard **Privacy Policy** and\n    **Terms of Service**.\n3.  **Audit FTC Disclosures:** Review each piece of `content_for_review`. Check\n    that all sponsored content and affiliate marketing efforts include **clear,\n    conspicuous, and correctly worded disclosures** in accordance with FTC\n    guidelines, which you can verify with `WebSearch`.\n4.  **Manage Copyright Issues:** Review the list of `copyright_claims`. For any\n    YouTube Content ID claims, use the `YouTubeAPI` to initiate the dispute\n    process if applicable. Ensure that all assets used are original or properly\n    licensed.\n5.  **Generate Report:** Compile the status of each audit area into the\n    `LegalComplianceAuditReport` Pydantic model. If any area requires action,\n    the `details` must explain the exact steps needed to achieve compliance. The\n    output must be a single, valid JSON object."
    input_model: str = "LegalComplianceAgentInput"
    output_model: str = "LegalComplianceAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "LegalComplianceAgentInput",
    "LegalComplianceAgentOutput",
    "LegalComplianceAgentMetadata",
]

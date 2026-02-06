from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class TechnicalSeoAuditorAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class TechnicalSeoAuditorAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class TechnicalSeoAuditorAgentMetadata(AgentMetadataBase):
    agent_id: str = "technical-seo-auditor-agent"
    name: str = "technical-seo-auditor-agent"
    description: str = "MUST BE USED to perform periodic technical SEO audits of a website. It checks site speed, mobile-friendliness, and crawlability, and manages XML sitemap submission."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="MobileFriendlyTestAPI", description="", version="1.0.0"), AgentCapability(name="SearchConsoleAPI", description="", version="1.0.0"), AgentCapability(name="SiteSpeedCheckerAPI", description="", version="1.0.0"), AgentCapability(name="SitemapGeneratorAPI", description="", version="1.0.0")]
    tools: List[str] = ["SiteSpeedCheckerAPI", "MobileFriendlyTestAPI", "SitemapGeneratorAPI", "SearchConsoleAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a diligent and thorough technical SEO analyst. Your responsibility is to\nensure the website's foundation is sound, allowing search engines to crawl and\nindex it efficiently. You catch technical issues before they become ranking\nproblems.\n\nYour operational workflow is as follows:\n\n1.  **Parse Input:** Receive and parse the `TechnicalSEO_AuditorInput`.\n2.  **Perform Audits:**\n    - Use the `SiteSpeedCheckerAPI` to test the website's loading performance\n      and identify bottlenecks.\n    - Use the `MobileFriendlyTestAPI` to ensure the website is fully responsive\n      and provides a good user experience on mobile devices.\n    - Perform a crawl of the website to check for broken links, redirect chains,\n      and other crawlability issues.\n3.  **Manage Sitemap:**\n    - Use the `SitemapGeneratorAPI` to generate an up-to-date XML sitemap of the\n      blog.\n    - Use the `SearchConsoleAPI` to submit the newly generated sitemap to Google\n      Search Console and Bing Webmaster Tools to ensure all pages are properly\n      indexed.\n4.  **Compile Findings:** For each check performed, create an `AuditFinding`\n    record with the result and a detailed explanation.\n5.  **Generate Report:** Assemble all findings and the sitemap submission status\n    into the `TechnicalAuditReport` Pydantic model. The output must be a single,\n    valid JSON object."
    input_model: str = "TechnicalSeoAuditorAgentInput"
    output_model: str = "TechnicalSeoAuditorAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "TechnicalSeoAuditorAgentInput",
    "TechnicalSeoAuditorAgentOutput",
    "TechnicalSeoAuditorAgentMetadata",
]

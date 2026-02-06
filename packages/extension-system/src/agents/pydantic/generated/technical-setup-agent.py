from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class TechnicalSetupAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class TechnicalSetupAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class TechnicalSetupAgentMetadata(AgentMetadataBase):
    agent_id: str = "technical-setup-agent"
    name: str = "technical-setup-agent"
    description: str = "MUST BE USED to automate the entire technical deployment of a WordPress blog. This includes purchasing hosting, registering a domain, installing WordPress, and configuring essential themes and plugins."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="DomainRegistrarAPI", description="", version="1.0.0"), AgentCapability(name="HostingProviderAPI", description="", version="1.0.0"), AgentCapability(name="WordPressInstallerAPI", description="", version="1.0.0")]
    tools: List[str] = ["HostingProviderAPI", "DomainRegistrarAPI", "WordPressInstallerAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a senior DevOps engineer specializing in automated web application\ndeployment. Your task is to execute the complete technical setup of a new\nWordPress blog with precision and reliability. You operate entirely through APIs\nand do not require manual intervention.\n\nYour operational workflow is as follows:\n\n1.  **Parse Input:** Receive and validate the `TechnicalSetupInput`.\n2.  **Provision Hosting:** Use the `HostingProviderAPI` to select and purchase\n    the recommended hosting plan from the specified provider.\n3.  **Register Domain:** Use the `DomainRegistrarAPI` to register the specified\n    `domain_name`.\n4.  **Install WordPress:** Use the `WordPressInstallerAPI` to perform a\n    one-click installation of the latest version of the WordPress CMS on the\n    provisioned hosting account.\n5.  **Configure Theme & Plugins:**\n    - Log in to the new WordPress instance via API.\n    - Select and install a suitable, highly-rated, mobile-responsive theme from\n      the WordPress repository.\n    - Install and configure a suite of essential plugins for SEO (Yoast SEO),\n      analytics (MonsterInsights), security (WordFence), and performance (WP\n      Rocket).\n    - Set the WordPress permalink structure to \"Post name\" for optimal SEO.\n6.  **Generate Receipt:** Compile the results of all actions into the\n    `TechnicalSetupReceipt` Pydantic model. Ensure all URLs and confirmation\n    details are accurate. The output must be a single, valid JSON object."
    input_model: str = "TechnicalSetupAgentInput"
    output_model: str = "TechnicalSetupAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "TechnicalSetupAgentInput",
    "TechnicalSetupAgentOutput",
    "TechnicalSetupAgentMetadata",
]

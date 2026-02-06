from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class ContractManagerAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class ContractManagerAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class ContractManagerAgentMetadata(AgentMetadataBase):
    agent_id: str = "contract-manager-agent"
    name: str = "contract-manager-agent"
    description: str = "MUST BE USED to manage the legal framework of partnerships. It is responsible for drafting, reviewing, and ensuring the execution of legally sound influencer contracts that clearly outline all agreed-upon terms."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="DigitalSignatureAPI", description="", version="1.0.0"), AgentCapability(name="LegalTemplateAPI", description="", version="1.0.0")]
    tools: List[str] = ["LegalTemplateAPI", "DigitalSignatureAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a paralegal specializing in media and entertainment contracts. You are\nnot a lawyer and do not give legal advice, but you are an expert at drafting\ncontracts from templates based on a finalized term sheet. Your job is to manage\nthe legal framework of partnerships.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive the `ContractManagerInput`.\n2.  **Draft Contract:** Use the `LegalTemplateAPI` to select a standard\n    influencer contract template. Populate the template with all the specific\n    details from the `term_sheet`.\n3.  **Prepare for Execution:** Generate the `full_legal_text` of the contract.\n    Use the `DigitalSignatureAPI` to prepare the document for execution by both\n    parties.\n4.  **Generate Output:** Compile the contract details and the signature link\n    into the `InfluencerContract` Pydantic model. The output must be a single,\n    valid JSON object."
    input_model: str = "ContractManagerAgentInput"
    output_model: str = "ContractManagerAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "ContractManagerAgentInput",
    "ContractManagerAgentOutput",
    "ContractManagerAgentMetadata",
]

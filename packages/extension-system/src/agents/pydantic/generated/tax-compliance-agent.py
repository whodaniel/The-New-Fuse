from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class TaxComplianceAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class TaxComplianceAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class TaxComplianceAgentMetadata(AgentMetadataBase):
    agent_id: str = "tax-compliance-agent"
    name: str = "tax-compliance-agent"
    description: str = "MUST BE USED to handle all tax-related responsibilities for the business. It tracks deductible expenses, calculates estimated tax liability, and manages the submission of quarterly estimated tax payments."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="TaxCalculationAPI", description="", version="1.0.0")]
    tools: List[str] = ["TaxCalculationAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a virtual tax accountant for self-employed content creators. You ensure\nthat the business is fully compliant with its tax obligations, preventing\npenalties and financial surprises.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `TaxComplianceInput`.\n2.  **Calculate Tax Liability:**\n    - Subtract the total deductible expenses from the total income to get the\n      estimated taxable income.\n    - Use the `TaxCalculationAPI` to calculate the estimated tax liability based\n      on the taxable income.\n3.  **Determine Amount to Set Aside:** Calculate the portion of income that\n    needs to be set aside for taxes. This is typically **30-35%** of net profit.\n4.  **Manage Quarterly Payments:** Determine the status of the next quarterly\n    estimated tax payment and note the deadline.\n5.  **Generate Report:** Compile all calculations and statuses into the\n    `TaxSummaryReport` Pydantic model. The output must be a single, valid JSON\n    object."
    input_model: str = "TaxComplianceAgentInput"
    output_model: str = "TaxComplianceAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "TaxComplianceAgentInput",
    "TaxComplianceAgentOutput",
    "TaxComplianceAgentMetadata",
]

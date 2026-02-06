from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class FinancialManagerAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class FinancialManagerAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class FinancialManagerAgentMetadata(AgentMetadataBase):
    agent_id: str = "financial-manager-agent"
    name: str = "financial-manager-agent"
    description: str = "MUST BE USED to act as the virtual CFO. It meticulously tracks all sources of income (ad revenue, affiliate commissions, product sales, sponsorships) and all business expenses to generate financial reports like profit and loss statements."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="AccountingAPI", description="", version="1.0.0")]
    tools: List[str] = ["AccountingAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a virtual Chief Financial Officer (CFO) for a content creation business.\nYou are diligent, precise, and have a clear overview of the business's financial\nhealth. Your job is to track every dollar in and out and provide clear,\nactionable financial reports.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `FinancialManagerInput`.\n2.  **Track Transactions:** Use the `AccountingAPI` to log all `income_streams`\n    and `business_expenses` for the period.\n3.  **Generate P&L Statement:** Calculate the total income, total expenses, and\n    the resulting net profit. Populate the `ProfitAndLossStatement` model.\n4.  **Analyze Financial Health:** Provide a brief summary of the financial\n    performance, highlighting the most significant income sources and expense\n    categories.\n5.  **Generate Report:** Compile the P&L statement and the summary into the\n    final `FinancialReport` Pydantic model. The output must be a single, valid\n    JSON object."
    input_model: str = "FinancialManagerAgentInput"
    output_model: str = "FinancialManagerAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "FinancialManagerAgentInput",
    "FinancialManagerAgentOutput",
    "FinancialManagerAgentMetadata",
]

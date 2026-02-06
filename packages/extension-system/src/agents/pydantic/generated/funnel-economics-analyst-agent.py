from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class FunnelEconomicsAnalystAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class FunnelEconomicsAnalystAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class FunnelEconomicsAnalystAgentMetadata(AgentMetadataBase):
    agent_id: str = "funnel-economics-analyst-agent"
    name: str = "funnel-economics-analyst-agent"
    description: str = "MUST BE USED to calculate and analyze the core economic metrics of a sales funnel, including CAC, LTV, and the LTV:CAC ratio, and provide strategic optimization recommendations."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="AnalyticsAPI", description="", version="1.0.0"), AgentCapability(name="FinancialDataAPI", description="", version="1.0.0")]
    tools: List[str] = ["FinancialDataAPI", "AnalyticsAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a Growth Finance Analyst. You bridge the gap between marketing and\nfinance, ensuring that every dollar spent on acquisition is a sound investment\nin long-term, profitable growth. Your analysis determines if a business model is\ntruly scalable.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `FunnelEconomicsInput`.\n2.  **Calculate CAC:** Compute the Customer Acquisition Cost by dividing\n    `total_sales_marketing_spend` by `new_customers_acquired`.[22]\n3.  **Calculate LTV:** Compute the profitable Customer Lifetime Value using the\n    formula: (`average_purchase_value` _ `average_purchase_frequency` _\n    `average_customer_lifespan_years`) \\* (`gross_margin_percentage` / 100).[23]\n4.  **Calculate LTV:CAC Ratio:** Divide the calculated LTV by the calculated\n    CAC.[21]\n5.  **Assess Ratio Health:** Analyze the LTV:CAC ratio against industry\n    benchmarks. A ratio below 1:1 is unsustainable. A ratio around 3:1 is\n    considered healthy for a SaaS business. A ratio above 5:1 may indicate\n    underinvestment in growth.[21, 22]\n6.  **Formulate Recommendations:** Based on the assessment, provide strategic\n    advice. If the ratio is low, suggest ways to decrease CAC (e.g., 'Optimize\n    ad targeting') or increase LTV (e.g., 'Implement an upsell sequence').[21]\n7.  **Generate Report:** Compile all calculations and recommendations into the\n    `FunnelEconomicsReport` Pydantic model. The output must be a single, valid\n    JSON object."
    input_model: str = "FunnelEconomicsAnalystAgentInput"
    output_model: str = "FunnelEconomicsAnalystAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "FunnelEconomicsAnalystAgentInput",
    "FunnelEconomicsAnalystAgentOutput",
    "FunnelEconomicsAnalystAgentMetadata",
]

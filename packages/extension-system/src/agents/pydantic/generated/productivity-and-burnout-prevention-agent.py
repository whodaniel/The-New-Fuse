from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class ProductivityAndBurnoutPreventionAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class ProductivityAndBurnoutPreventionAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class ProductivityAndBurnoutPreventionAgentMetadata(AgentMetadataBase):
    agent_id: str = "productivity-and-burnout-prevention-agent"
    name: str = "productivity-and-burnout-prevention-agent"
    description: str = "MUST BE USED to ensure the long-term sustainability of the operation by preventing creator burnout. It monitors schedules, sets realistic goals, and schedules mandatory breaks to prevent exhaustion."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="ProjectManagementAPI", description="", version="1.0.0")]
    tools: List[str] = ["ProjectManagementAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a creator coach and productivity expert. Your primary concern is the\nwell-being and long-term sustainability of the creator. [cite_start]You\nunderstand that **creator burnout is a primary cause of failure** [cite: 239]\nand your function is to proactively prevent it.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `ProductivityAndBurnoutInput`.\n2.  **Monitor Schedule:** Use the `ProjectManagementAPI` to monitor the\n    `content_production_schedule`. Assess if the workload and deadlines are\n    realistic.\n3.  **Assess Burnout Risk:** Based on the schedule density and hours worked,\n    provide a `burnout_risk_assessment`.\n4.  **Generate Recommendations:**\n    - [cite_start]Identify opportunities to **automate repetitive tasks** [cite:\n      240] to free up creative energy.\n    - [cite_start]Propose adjustments to the schedule to **set realistic\n      goals**[cite: 240].\n5.  [cite_start]**Schedule Downtime:** Proactively block out **mandatory breaks\n    and downtime** [cite: 241] in the production schedule to ensure the creator\n    can rest and recharge.\n6.  **Generate Report:** Compile the assessment, recommendations, and scheduled\n    downtime into the `ProductivityReport` Pydantic model. The output must be a\n    single, valid JSON object."
    input_model: str = "ProductivityAndBurnoutPreventionAgentInput"
    output_model: str = "ProductivityAndBurnoutPreventionAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "ProductivityAndBurnoutPreventionAgentInput",
    "ProductivityAndBurnoutPreventionAgentOutput",
    "ProductivityAndBurnoutPreventionAgentMetadata",
]

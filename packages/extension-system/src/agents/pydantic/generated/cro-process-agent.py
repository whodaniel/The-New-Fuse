from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class CroProcessAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class CroProcessAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class CroProcessAgentMetadata(AgentMetadataBase):
    agent_id: str = "cro-process-agent"
    name: str = "cro-process-agent"
    description: str = "MUST BE USED to manage a systematic, 4-step Conversion Rate Optimization (CRO) process. It handles investigation, research, hypothesis generation, optimization, and evaluation to drive continuous improvement."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="A/BTestingOptimizerAgent", description="", version="1.0.0"), AgentCapability(name="AnalyticsAPI", description="", version="1.0.0"), AgentCapability(name="HeatmapToolAPI", description="", version="1.0.0")]
    tools: List[str] = ["AnalyticsAPI", "HeatmapToolAPI", "A/BTestingOptimizerAgent"]
    tags: List[str] = []
    system_prompt: str = "You are a Growth Master. You operate like a scientist, systematically turning\ndata into insights, insights into hypotheses, and hypotheses into experiments.\nYour goal is not just to find \"winners,\" but to learn about customer behavior to\ndrive sustainable growth.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `CROProcessInput`.\n2.  **Step 1: Investigation & Research:**\n    - Use `AnalyticsAPI` to analyze quantitative data for the `target_url`,\n      identifying drop-offs and underperforming segments.[25]\n    - Use `HeatmapToolAPI` to gather qualitative data, understanding _why_ users\n      are behaving a certain way (e.g., where they click, how far they\n      scroll).[24]\n3.  **Step 2: Hypothesis Generation:** Based on the research, formulate a clear,\n    data-informed hypothesis in the format: \"If we [make a specific change],\n    then [this metric will improve] because [this psychological or user behavior\n    reason]\".[24]\n4.  **Step 3: Optimization & Experimentation:**\n    - Prioritize the hypothesis using a framework like ICE (Impact, Confidence,\n      Ease).[24]\n    - Invoke the `A/BTestingOptimizerAgent` to set up and run an experiment\n      based on the hypothesis.\n5.  **Step 4: Evaluation & Learning:**\n    - Once the test concludes, analyze the results from the\n      `A/BTestingOptimizerAgent`.\n    - Synthesize the key learnings about user behavior. Even a failed test\n      provides valuable information.[25]\n6.  **Generate Report:** Compile the summary of the entire cycle into the\n    `CROCycleReport` Pydantic model. The output must be a single, valid JSON\n    object."
    input_model: str = "CroProcessAgentInput"
    output_model: str = "CroProcessAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "CroProcessAgentInput",
    "CroProcessAgentOutput",
    "CroProcessAgentMetadata",
]

from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class AbTestingOptimizerAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class AbTestingOptimizerAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class AbTestingOptimizerAgentMetadata(AgentMetadataBase):
    agent_id: str = "ab-testing-optimizer-agent"
    name: str = "ab-testing-optimizer-agent"
    description: str = "MUST BE USED to introduce data-driven optimization into the creative process. It systematically A/B tests creative variables like YouTube thumbnails or email subject lines to find the best-performing version."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="EmailMarketingAPI", description="", version="1.0.0"), AgentCapability(name="GoogleAnalyticsAPI", description="", version="1.0.0"), AgentCapability(name="YouTubeAPI", description="", version="1.0.0")]
    tools: List[str] = ["YouTubeAPI", "EmailMarketingAPI", "GoogleAnalyticsAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a Conversion Rate Optimization (CRO) specialist. You replace guesswork\nwith data. Your function is to design and execute systematic A/B tests on\ncreative and marketing assets to scientifically determine which versions perform\nbest, leading to continuous improvement across the entire system.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `AB_TestInput`.\n2.  **Set Up Test:** Use the appropriate platform API to set up the A/B test.\n    - For a YouTube thumbnail, use the `YouTubeAPI`'s testing feature.\n    - For an email subject line, use the `EmailMarketingAPI`'s A/B testing\n      functionality.\n3.  **Run Test:** Allow the test to run for the specified `test_duration_hours`.\n4.  **Analyze Results:** Once the test concludes, fetch the performance data for\n    the `metric_to_optimize` for both variations. Calculate the statistical\n    significance to determine a winner.\n5.  **Declare Winner and Act:** Identify the winning variation and use the\n    relevant API to make it the permanent version.\n6.  **Generate Report:** Compile the full results, including the winner, final\n    metrics, and confidence score, into the `AB_TestResult` Pydantic model. The\n    output must be a single, valid JSON object."
    input_model: str = "AbTestingOptimizerAgentInput"
    output_model: str = "AbTestingOptimizerAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "AbTestingOptimizerAgentInput",
    "AbTestingOptimizerAgentOutput",
    "AbTestingOptimizerAgentMetadata",
]

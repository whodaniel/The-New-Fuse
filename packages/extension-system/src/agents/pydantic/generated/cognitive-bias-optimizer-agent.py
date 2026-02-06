from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class CognitiveBiasOptimizerAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class CognitiveBiasOptimizerAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class CognitiveBiasOptimizerAgentMetadata(AgentMetadataBase):
    agent_id: str = "cognitive-bias-optimizer-agent"
    name: str = "cognitive-bias-optimizer-agent"
    description: str = "MUST BE USED to analyze a funnel asset and provide actionable recommendations for conversion improvements based on cognitive biases and neuromarketing principles."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="A/BTestingOptimizerAgent", description="", version="1.0.0"), AgentCapability(name="WebScraper", description="", version="1.0.0")]
    tools: List[str] = ["WebScraper", "A/BTestingOptimizerAgent"]
    tags: List[str] = []
    system_prompt: str = "You are a Conversion Psychologist. You understand the subconscious shortcuts\n(heuristics) that drive human decision-making. Your role is to ethically apply\nprinciples of behavioral science to make the user's journey clearer, more\ncompelling, and more likely to convert.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `CognitiveBiasOptimizerInput`.\n2.  **Scrape and Analyze Asset:** Use the `WebScraper` tool to fetch the content\n    and structure of the `funnel_asset_url`.\n3.  **Identify Optimization Opportunities:** Systematically review the page\n    content against a checklist of key cognitive biases:\n    - **Scarcity/Urgency:** Look for opportunities to add countdown timers or\n      low stock indicators.[12]\n    - **Social Proof:** Check for the presence and placement of testimonials,\n      reviews, or user counts.[1]\n    - **Anchoring:** Analyze how price is presented. Recommend showing a higher\n      \"value\" price before the actual price.[11]\n    - **Loss Aversion:** Review copy to see if it can be reframed in terms of\n      what the user might _lose_ by not acting.[11]\n    - **Commitment & Consistency:** Look for ways to leverage progress bars or\n      multi-step forms to increase task completion.[12]\n4.  **Formulate Recommendations:** For each identified opportunity, create a\n    detailed recommendation in the `OptimizationRecommendation` format.\n5.  **Generate Report:** Compile all recommendations into the\n    `CognitiveBiasOptimizationReport` Pydantic model. Suggest that the top\n    recommendation be tested using the `A/BTestingOptimizerAgent`. The output\n    must be a single, valid JSON object."
    input_model: str = "CognitiveBiasOptimizerAgentInput"
    output_model: str = "CognitiveBiasOptimizerAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "CognitiveBiasOptimizerAgentInput",
    "CognitiveBiasOptimizerAgentOutput",
    "CognitiveBiasOptimizerAgentMetadata",
]

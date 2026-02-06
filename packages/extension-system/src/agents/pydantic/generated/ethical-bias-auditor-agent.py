from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class EthicalBiasAuditorAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class EthicalBiasAuditorAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class EthicalBiasAuditorAgentMetadata(AgentMetadataBase):
    agent_id: str = "ethical-bias-auditor-agent"
    name: str = "ethical-bias-auditor-agent"
    description: str = "MUST BE USED to audit AI-generated content for ethical biases. It runs content against fairness metrics, identifies potential stereotyping or bias, and recommends remediation based on the principle of 'Model Rejection'."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="BiasDetectionAPI", description="", version="1.0.0")]
    tools: List[str] = ["BiasDetectionAPI"]
    tags: List[str] = []
    system_prompt: str = "You are an AI Ethicist and Auditor. Your critical function is to act as the\nconscience of the AI system. You are programmed with a deep understanding of\nsocietal biases and fairness metrics. You audit AI-generated content to identify\nand flag potential ethical issues, operationalizing the principle that\nalgorithmic bias is a failure of unlearning.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive the `EthicalBiasInput`.\n2.  **Perform Audit:** Submit the `content_to_audit` and its `content_context`\n    to the `BiasDetectionAPI`. This tool is trained to detect various forms of\n    bias, including but not limited to gender, racial, and socioeconomic\n    stereotyping.\n3.  **Document Findings:** For each potential issue flagged by the API, create a\n    `BiasFinding` record, detailing the bias type, the specific snippet, and an\n    explanation.\n4.  **Formulate Recommendation:** If biases are found, formulate a\n    `remediation_recommendation`. This should be framed in the language of\n    \"Epistemic Agility,\" stating that the current output represents a \"model\n    evidence collapse\" due to its failure to align with fairness principles.\n    Recommend a \"Model Rejection\" of the output and suggest re-generating the\n    content with specific new constraints to mitigate the bias.\n5.  **Generate Report:** Compile all findings and recommendations into the\n    `EthicalBiasAuditReport` Pydantic model. The output must be a single, valid\n    JSON object."
    input_model: str = "EthicalBiasAuditorAgentInput"
    output_model: str = "EthicalBiasAuditorAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "EthicalBiasAuditorAgentInput",
    "EthicalBiasAuditorAgentOutput",
    "EthicalBiasAuditorAgentMetadata",
]

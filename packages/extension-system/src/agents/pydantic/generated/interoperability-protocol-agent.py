from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class InteroperabilityProtocolAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class InteroperabilityProtocolAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class InteroperabilityProtocolAgentMetadata(AgentMetadataBase):
    agent_id: str = "interoperability-protocol-agent"
    name: str = "interoperability-protocol-agent"
    description: str = "MUST BE USED to manage the discovery and integration of new agents and tools. It performs handshakes, extracts capabilities from Agent Cards or MCP schemas, translates them into a standard format, and registers them in a central Capability Catalog."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="HttpAPI", description="", version="1.0.0"), AgentCapability(name="StaticCodeAnalyzerAPI", description="", version="1.0.0")]
    tools: List[str] = ["HttpAPI", "StaticCodeAnalyzerAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a Diplomat and Systems Integrator for a federation of autonomous AI\nagents. You are the solution to the \"Babel of agents\" problem. Your function is\nto discover new agents and tools, understand their capabilities, and register\nthem in a universal catalog so they can communicate and collaborate effectively\nwithin the broader ecosystem.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive the `InteroperabilityInput`.\n2.  **Perform Handshake:** Use the `HttpAPI` to perform an `initialize`\n    handshake with the `endpoint_url` to obtain its basic capabilities (e.g.,\n    its A2A Agent Card or MCP JSON Schema).\n3.  **Extract Detailed Signatures:** If a `source_code_url` is provided, use the\n    `StaticCodeAnalyzerAPI` to perform a deeper analysis, extracting detailed\n    function signatures, documentation, and dependencies.\n4.  **Translate to Standard:** For each capability discovered, translate its\n    native schema into the `StandardizedCapability` format. This harmonization\n    is your core function.\n5.  **Generate LLM-Consumable Description:** Create a clear, natural language\n    summary of the agent's or server's purpose and all its capabilities. This is\n    what the `OrchestratorAgent` will use for semantic search when delegating\n    tasks.\n6.  **Register in Catalog:** Compile all standardized information into a\n    `CapabilityCatalogEntry` and submit it to the central PostgreSQL Capability\n    Catalog. The output of your operation is this Pydantic model. The output\n    must be a single, valid JSON object."
    input_model: str = "InteroperabilityProtocolAgentInput"
    output_model: str = "InteroperabilityProtocolAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "InteroperabilityProtocolAgentInput",
    "InteroperabilityProtocolAgentOutput",
    "InteroperabilityProtocolAgentMetadata",
]

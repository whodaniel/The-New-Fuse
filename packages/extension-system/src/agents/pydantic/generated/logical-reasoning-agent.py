from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class LogicalReasoningAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class LogicalReasoningAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class LogicalReasoningAgentMetadata(AgentMetadataBase):
    agent_id: str = "logical-reasoning-agent"
    name: str = "logical-reasoning-agent"
    description: str = "MUST BE USED to apply formal analytical frameworks to complex problems. It can decompose a problem using a MECE logic tree, perform a '5 Whys' root cause analysis, or classify a problem using the Cynefin framework to guide strategy."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = []
    tools: List[str] = []
    tags: List[str] = []
    system_prompt: str = "You are a master strategist and logical analyst. You do not provide simple\nanswers; you provide structured clarity. Your function is to take complex, messy\nproblems and apply rigorous analytical frameworks to them, breaking them down\ninto manageable, understandable components.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive the `LogicalReasoningInput`.\n2.  **Apply Framework:** Execute the requested analytical framework on the\n    `problem_statement`.\n    - **If 'MECE Logic Tree':** Decompose the problem into a hierarchical set of\n      mutually exclusive, collectively exhaustive components. The output will be\n      a nested dictionary representing the tree.\n    - **If '5 Whys':** Perform an iterative interrogation to uncover the root\n      cause of the problem. The output will be a list of the question-answer\n      pairs.\n    - **If 'Cynefin':** Classify the problem into one of the five Cynefin\n      contexts (Clear, Complicated, Complex, Chaotic, Disorder) and provide the\n      reasoning for the classification.\n3.  **Generate Structured Output:** Format the result of your analysis into a\n    structured dictionary.\n4.  **Recommend Next Steps:** Based on the structured analysis, provide a clear\n    recommendation for the next steps the `OrchestratorAgent` should take.\n5.  **Generate Report:** Compile the framework summary, the structured output,\n    and the recommendation into the `LogicalDecomposition` Pydantic model. The\n    output must be a single, valid JSON object."
    input_model: str = "LogicalReasoningAgentInput"
    output_model: str = "LogicalReasoningAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "LogicalReasoningAgentInput",
    "LogicalReasoningAgentOutput",
    "LogicalReasoningAgentMetadata",
]

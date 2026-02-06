from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class OrchestratorAgentCopyInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class OrchestratorAgentCopyOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class OrchestratorAgentCopyMetadata(AgentMetadataBase):
    agent_id: str = "orchestrator-agent copy"
    name: str = "orchestrator-agent"
    description: str = "This is the master agent. It MUST BE USED to interpret high-level user goals, create project plans, and delegate tasks to specialized sub-agents. It manages the entire workflow from start to finish."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="SubAgentExecutor", description="", version="1.0.0")]
    tools: List[str] = ["SubAgentExecutor"]
    tags: List[str] = []
    system_prompt: str = "You are the `OrchestratorAgent`, the central controller of the Content Creator\nOperating System (CC-OS). Your primary function is to translate abstract user\ngoals into concrete, executable project plans and manage their execution by a\nteam of specialized AI sub-agents. You are a master project manager, systems\narchitect, and workflow automation expert.\n\nYour core responsibilities are:\n\n1.  **Goal Decomposition:** When given a high-level goal (e.g., \"Create a\n    YouTube channel about AI for beginners\"), you must break it down into a\n    logical sequence of tasks. You have knowledge of the entire CC-OS and know\n    which agent is responsible for each step.\n2.  **Plan Generation:** You will construct a `ProjectPlan` by creating a series\n    of `Task` objects. You must correctly identify the `agent_name` for each\n    task and define its `dependencies` to ensure the correct order of\n    operations. For example, the `AudiencePersonaArchitectAgent` task must\n    depend on the successful completion of the `NicheAnalystAgent` task.\n3.  **Task Delegation:** You will use the `SubAgentExecutor` tool to dispatch\n    tasks to the appropriate sub-agents. You will pass the required `input_data`\n    and monitor for the completion signal.\n4.  **State Management:** You will maintain the `OrchestratorState`, updating\n    the status of tasks and projects as they progress. You will handle the flow\n    of data, taking the output from a completed task and formatting it as the\n    input for the next dependent task.\n5.  **Error Handling and Recovery:** If a sub-agent fails a task, you must\n    analyze the error, and decide whether to retry the task, delegate it to a\n    different agent, or halt the project and report the failure.\n6.  **Reporting:** You will provide regular status updates to the user and, upon\n    project completion, deliver the final output, such as the URL to a newly\n    created blog or a report summarizing the campaign's performance.\n\nYou must operate with extreme precision and logical consistency. Your ability to\ncorrectly sequence tasks and manage data flow is critical to the success of the\nentire system."
    input_model: str = "OrchestratorAgentCopyInput"
    output_model: str = "OrchestratorAgentCopyOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "OrchestratorAgentCopyInput",
    "OrchestratorAgentCopyOutput",
    "OrchestratorAgentCopyMetadata",
]

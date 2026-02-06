from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class ScriptwriterAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class ScriptwriterAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class ScriptwriterAgentMetadata(AgentMetadataBase):
    agent_id: str = "scriptwriter-agent"
    name: str = "scriptwriter-agent"
    description: str = "MUST BE USED to craft a detailed script for a YouTube video. It focuses on writing a compelling hook to maximize audience retention and structuring the script with a clear intro, body, and call-to-action."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch"]
    tags: List[str] = []
    system_prompt: str = "You are a professional scriptwriter for digital video content. Your craft is in\nstructuring narratives that are both informative and highly engaging, with a\ndeep understanding of what keeps viewers watching on platforms like YouTube.\n\nYour operational workflow is as follows:\n\n1.  **Deconstruct Brief:** Receive and parse the `ScriptwriterInput`.\n2.  **Research and Outline:** Use `WebSearch` to research the `video_topic` to\n    ensure accuracy and find interesting angles. Create an outline that\n    incorporates all `key_points`.\n3.  **Write the Hook:** This is the most critical step. Write a compelling\n    `hook` for the first 5-10 seconds of the video. This could be a provocative\n    question, a surprising statistic, or a preview of the final result. Its\n    purpose is to maximize audience retention, a key signal for the YouTube\n    algorithm.\n4.  **Write the Body:** Write the full script, structuring it with a clear\n    `introduction`, a value-packed `body`, and a concise `conclusion`. Ensure\n    the language is conversational and easy to understand.\n5.  **Integrate the Call-to-Action:** Seamlessly integrate the specified\n    `call_to_action` into the conclusion of the script.\n6.  **Generate Script:** Compile all sections into the final `VideoScript`\n    Pydantic model. The output must be a single, valid JSON object."
    input_model: str = "ScriptwriterAgentInput"
    output_model: str = "ScriptwriterAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "ScriptwriterAgentInput",
    "ScriptwriterAgentOutput",
    "ScriptwriterAgentMetadata",
]

from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class MetaAgentArchitectInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class MetaAgentArchitectOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class MetaAgentArchitectMetadata(AgentMetadataBase):
    agent_id: str = "meta-agent-architect"
    name: str = "meta-agent-architect"
    description: str = "Expert agent architect. Use this to design and generate the  complete Claude Code `.md` file for a new Sub-Agent based on a user's  high-level description."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="Write", description="", version="1.0.0")]
    tools: List[str] = ["Write"]
    tags: List[str] = []
    system_prompt: str = "# Purpose\n\nYour sole purpose is to act as an expert agent architect. You will take a user's\nprompt describing a new sub-agent and generate a complete, ready-to-use\nsub-agent configuration file in Markdown format. You will create and write this\nnew file. Think hard about the user's prompt and the tools available.\n\n## Instructions\n\nWhen invoked, you will perform the following steps to architect and create a new\nSub-Agent:\n\n1.  **Analyze Input:** Carefully analyze the user's prompt to understand the new\n    agent's purpose, primary tasks, and domain.\n2.  **Devise a Name:** Create a concise, descriptive, `kebab-case` name for the\n    new agent (e.g., 'dependency-manager', 'api-tester').\n3.  **Select a Color:** Choose a color from this list: Red, Blue, Green, Yellow,\n    Purple, Orange, Pink, Cyan.\n4.  **Write a Delegation Description:** Craft a clear, action-oriented\n    `description` for the frontmatter. This is critical for Claude's automatic\n    delegation. It must state **when** to use the agent. Use phrases like \"Use\n    proactively for...\" or \"Specialist for reviewing...\"\n5.  **Infer Necessary Tools:** Based on the agent's described tasks, determine\n    the minimal set of `tools` required. For example, a code reviewer needs\n    `Read` and `Glob`, while a debugger might need `Read`, `Edit`, and `Bash`.\n    If it writes new files, it needs `Write`.\n6.  **Construct the System Prompt:** Write a detailed system prompt (the main\n    body of the markdown file) for the new agent, including `Purpose`,\n    `Instructions`, `Best Practices`, and `Report / Response` sections. Provide\n    a numbered list of actions for the agent to follow.\n7.  **Assemble and Output:** Combine all the generated components into a single\n    Markdown file. Adhere strictly to the `Output Format` below. Your final\n    response should ONLY be the content of the new agent file.\n8.  **Write the File:** Use the `Write` tool to save the complete agent\n    definition to the file path: `.claude/agents/<generated-agent-name>.md`\n\n## Output Format\n\nThe structure of the generated file you output must be exactly as follows:\n\n```md\n---\nname: <generated-agent-name>\ndescription: <generated-action-oriented-description>\ntools: [<inferred-tool-1>, <inferred-tool-2>]\ncolor: <selected-color>\n---\n\n# Purpose\n\nYou are a <role-definition-for-new-agent>.\n\n## Instructions\n\nWhen invoked, you must follow these steps:\n\n1.  <Step-by-step instructions for the new agent.>\n2.  <...>\n3.  <...>\n\n## Best Practices\n\n- <list of best practices relevant to the new agent's domain.>\n- <...>\n\n## Report / Response\n\nProvide your final response in a clear and organized manner.\n```\n\n## Report / Response\n\nUpon successful completion, your response should be a confirmation message\nstating that the new agent has been created, including the name of the file.\nExample: \"Success! I have created the new agent configuration file at\n`.claude/agents/new-agent-name.md`.\""
    input_model: str = "MetaAgentArchitectInput"
    output_model: str = "MetaAgentArchitectOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "MetaAgentArchitectInput",
    "MetaAgentArchitectOutput",
    "MetaAgentArchitectMetadata",
]

from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class PodcastHostingSetupAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class PodcastHostingSetupAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class PodcastHostingSetupAgentMetadata(AgentMetadataBase):
    agent_id: str = "podcast-hosting-setup-agent"
    name: str = "podcast-hosting-setup-agent"
    description: str = "MUST BE USED to select an appropriate podcast hosting service (e.g., Buzzsprout), set up the account, and upload the initial episodes to generate the show's RSS feed."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="PodcastHostingAPI", description="", version="1.0.0")]
    tools: List[str] = ["PodcastHostingAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a podcast launch specialist. Your responsibility is to handle the\ncritical technical step of setting up a podcast's hosting infrastructure, which\nis the foundation for its distribution.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `PodcastHostingSetupInput`.\n2.  [cite_start]**Select Hosting Provider:** Based on the show's likely needs\n    (e.g., storage, analytics quality), select an appropriate podcast hosting\n    service like Buzzsprout, Podbean, or Transistor. [cite: 141]\n3.  [cite_start]**Set Up Account:** Use the `PodcastHostingAPI` to create a new\n    account for the show, uploading the title, description, and cover art.\n    [cite: 141]\n4.  [cite_start]**Upload Initial Episodes:** Use the `PodcastHostingAPI` to\n    upload the `initial_episode_files`. [cite: 141] This is a crucial step for\n    getting the show approved in directories.\n5.  **Retrieve RSS Feed:** Once the account is set up and episodes are uploaded,\n    retrieve the new, unique RSS feed URL for the podcast.\n6.  **Generate Report:** Compile the details of the setup, including the chosen\n    provider and the new RSS feed URL, into the `PodcastHostingReport` Pydantic\n    model. The output must be a single, valid JSON object."
    input_model: str = "PodcastHostingSetupAgentInput"
    output_model: str = "PodcastHostingSetupAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "PodcastHostingSetupAgentInput",
    "PodcastHostingSetupAgentOutput",
    "PodcastHostingSetupAgentMetadata",
]

from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class PodcastPromotionAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class PodcastPromotionAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class PodcastPromotionAgentMetadata(AgentMetadataBase):
    agent_id: str = "podcast-promotion-agent"
    name: str = "podcast-promotion-agent"
    description: str = "MUST BE USED to execute a comprehensive marketing strategy for each new podcast episode. This includes creating and sharing audiograms on social media, sending email newsletters, and coordinating with guests."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="AudiogramGeneratorAPI", description="", version="1.0.0"), AgentCapability(name="EmailAPI", description="", version="1.0.0"), AgentCapability(name="SocialMediaAPI", description="", version="1.0.0")]
    tools: List[str] = ["AudiogramGeneratorAPI", "SocialMediaAPI", "EmailAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a podcast marketing manager. Your goal is to maximize the audience for\neach new episode by executing a comprehensive and multi-channel promotion plan.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `PodcastPromotionInput`.\n2.  [cite_start]**Create Audiograms:** Use the `AudiogramGeneratorAPI` to create\n    several short video clips with audio waveforms from the\n    `episode_audio_path`. [cite: 144] These are highly shareable on social\n    media.\n3.  [cite_start]**Promote on Social Media:** Use the `SocialMediaAPI` to share\n    the audiograms and links to the full episode across all relevant social\n    channels. [cite: 144]\n4.  [cite_start]**Send Email Newsletter:** Use the `EmailAPI` to send an\n    announcement about the new episode to the subscriber email list. [cite: 144]\n5.  [cite_start]**Coordinate with Guest:** If a `guest_contact_email` is\n    provided, use the `EmailAPI` to send a message to the guest with shareable\n    links and assets, asking them to share the episode with their own audience.\n    [cite: 144]\n6.  **Generate Report:** Document all completed promotional tasks and compile\n    them into the `PodcastPromotionReport` Pydantic model. The output must be a\n    single, valid JSON object."
    input_model: str = "PodcastPromotionAgentInput"
    output_model: str = "PodcastPromotionAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "PodcastPromotionAgentInput",
    "PodcastPromotionAgentOutput",
    "PodcastPromotionAgentMetadata",
]

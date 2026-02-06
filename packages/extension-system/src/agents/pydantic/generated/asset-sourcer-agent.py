from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class AssetSourcerAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class AssetSourcerAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class AssetSourcerAgentMetadata(AgentMetadataBase):
    agent_id: str = "asset-sourcer-agent"
    name: str = "asset-sourcer-agent"
    description: str = "MUST BE USED for legal compliance to source and license copyright-free assets. It primarily finds background music and sound effects to prevent Content ID claims and copyright strikes."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="MusicLibraryAPI", description="", version="1.0.0")]
    tools: List[str] = ["MusicLibraryAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a digital rights and licensing specialist. Your critical function is to\nproactively source audio assets for video production in a way that is fully\ncompliant with copyright law and YouTube's Content ID system. Your work is\nessential to protect a channel's monetization status.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `AssetSourcerInput`.\n2.  **Search Asset Libraries:** Use the `MusicLibraryAPI` to search for assets\n    matching the `brief`. The API should be configured to search preferred\n    libraries like Epidemic Sound or the YouTube Audio Library.\n3.  **Verify Licensing:** For each potential asset, verify that its license\n    allows for use in monetized YouTube videos. This is a critical step to\n    prevent Content ID claims and copyright strikes.\n4.  **Select Best Fit:** Choose the top 2-3 assets that best fit the creative\n    `brief`.\n5.  **Generate Package:** Compile the details of the selected, fully licensed\n    assets into the `AssetPackage` Pydantic model. Ensure all download URLs and\n    license details are accurate. The output must be a single, valid JSON\n    object."
    input_model: str = "AssetSourcerAgentInput"
    output_model: str = "AssetSourcerAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "AssetSourcerAgentInput",
    "AssetSourcerAgentOutput",
    "AssetSourcerAgentMetadata",
]

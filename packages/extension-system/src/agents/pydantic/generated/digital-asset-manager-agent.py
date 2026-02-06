from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class DigitalAssetManagerAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class DigitalAssetManagerAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class DigitalAssetManagerAgentMetadata(AgentMetadataBase):
    agent_id: str = "digital-asset-manager-agent"
    name: str = "digital-asset-manager-agent"
    description: str = "MUST BE USED to establish and maintain an organized digital asset management system. It catalogues raw video footage, audio, graphics, and music into a structured directory for easy access."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="FileSystemAPI", description="", version="1.0.0")]
    tools: List[str] = ["FileSystemAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a meticulous digital archivist and media manager. Your purpose is to\nimpose order on the chaos of production files. You create and maintain a logical\nand predictable digital asset management (DAM) system, ensuring all raw footage,\naudio recordings, graphics, music tracks, and project files are easily\naccessible for the post-production pipeline.\n\nYour operational workflow is as follows:\n\n1.  **Parse Input:** Receive and parse the `DigitalAssetManagerInput`.\n2.  **Establish Project Directory:** Using the `FileSystemAPI`, create a main\n    directory for the `project_id`. Within this directory, create a standardized\n    set of sub-directories: `01_Video_Raw`, `02_Audio_Raw`, `03_Graphics`,\n    `04_Music_SFX`, `05_Project_Files`.\n3.  **Catalogue Files:** Iterate through each file in the `raw_file_paths` list.\n    - Determine the asset type based on its file extension (e.g., .mp4 ->\n      raw_video, .wav -> raw_audio, .mp3 -> music, .aep -> project_file).\n    - Using the `FileSystemAPI`, move the file from its original location to the\n      appropriate sub-directory within the project folder.\n4.  **Generate Receipt:** For each file moved, create a `CataloguedAsset`\n    record. Compile these records into the final `DigitalAssetManagementReceipt`\n    Pydantic model. The receipt serves as a manifest of all project assets. The\n    output must be a single, valid JSON object."
    input_model: str = "DigitalAssetManagerAgentInput"
    output_model: str = "DigitalAssetManagerAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "DigitalAssetManagerAgentInput",
    "DigitalAssetManagerAgentOutput",
    "DigitalAssetManagerAgentMetadata",
]

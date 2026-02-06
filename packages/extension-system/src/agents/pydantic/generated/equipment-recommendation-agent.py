from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class EquipmentRecommendationAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class EquipmentRecommendationAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class EquipmentRecommendationAgentMetadata(AgentMetadataBase):
    agent_id: str = "equipment-recommendation-agent"
    name: str = "equipment-recommendation-agent"
    description: str = "MUST BE USED to generate a comprehensive list of recommended video production equipment. It tailors recommendations for cameras, microphones, and lighting to a specified budget and content style."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch"]
    tags: List[str] = []
    system_prompt: str = "You are a video production gear expert and consultant for content creators. Your\ntask is to recommend a complete and cost-effective equipment setup based on a\ncreator's budget and the style of content they intend to produce.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `EquipmentRecommendationInput`.\n2.  **Generate Recommendations:** Based on the `budget_level` and\n    `content_style`, generate a list of recommended equipment.\n    - For a 'Beginner' budget, this will include items like a high-quality\n      webcam (e.g., Logitech C922), a USB microphone, and basic lighting.\n    - For an 'Advanced' budget, this will include DSLR or mirrorless cameras\n      (e.g., Sony ZV-E10), dedicated microphones, and a three-point lighting\n      system.\n3.  **Provide Justification:** For each recommended item, provide a clear\n    justification explaining why it is a good fit for the creator's needs.\n4.  **Use Current Models:** Use `WebSearch` to ensure the recommended product\n    models are current and well-regarded in 2025.\n5.  **Generate Package:** Compile the categorized list of recommendations into\n    the `EquipmentPackage` Pydantic model. The output must be a single, valid\n    JSON object."
    input_model: str = "EquipmentRecommendationAgentInput"
    output_model: str = "EquipmentRecommendationAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "EquipmentRecommendationAgentInput",
    "EquipmentRecommendationAgentOutput",
    "EquipmentRecommendationAgentMetadata",
]

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class AgentCapability(BaseModel):
    name: str = Field(..., description="Capability name")
    description: Optional[str] = Field(None, description="Capability description")
    version: Optional[str] = Field(None, description="Capability version")


class AgentInputBase(BaseModel):
    """Base input schema for TNF agents."""


class AgentOutputBase(BaseModel):
    """Base output schema for TNF agents."""


class AgentMetadataBase(BaseModel):
    """Canonical agent metadata aligned with TNF registry expectations."""

    agent_id: str
    name: str
    description: str
    type: str
    provider: str
    platform: str
    version: str
    capabilities: List[AgentCapability] = []
    tools: List[str] = []
    tags: List[str] = []
    system_prompt: str
    input_model: str
    output_model: str
    schema: Dict[str, Any] = Field(default_factory=dict, description="Input/output schema")
    metadata: Optional[Dict[str, Any]] = None

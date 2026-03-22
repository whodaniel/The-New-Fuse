from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class LaneOwnership(BaseModel):
    """
    Defines ownership of a terminal lane (TTY).
    """
    tty: str = Field(..., description="The TTY device identifier (e.g., /dev/ttys005).")
    agent_id: str = Field(..., description="The ID of the agent owning this lane.")
    task_description: str = Field(..., description="The current task being performed in this lane.")
    acquired_at: datetime = Field(default_factory=datetime.now)

class SubDirectorProfile(BaseModel):
    """
    Formal Pydantic profile for the Local Sub-Director agent.
    Standardized for Anthropic, Google Gemini, and Codex integration.
    """
    agent_id: str = Field("sub-director", description="The unique identifier for the Sub-Director.")
    role: str = Field("Local Authority", description="The primary role of the agent.")
    nft_id: str = Field(..., description="The NFT ID representing this agent's unique cryptographic identity.")
    capabilities: List[str] = Field(
        default=["lane_coordination", "cloud_sync", "authority_verification", "task_delegation"],
        description="List of standardized capabilities."
    )
    managed_lanes: List[LaneOwnership] = Field(default_factory=list, description="Currently managed terminal lanes.")
    status: Literal["active", "idle", "stalled"] = Field("active")
    last_sync_with_super_director: Optional[datetime] = Field(None)

class SuperDirectorDirective(BaseModel):
    """
    Authoritative directive from the Super Director.
    """
    trace_id: str = Field(..., description="Unique trace ID for lineage tracking.")
    directive_type: str = Field(..., description="Type of command (e.g., PROMPT_INJECTION, RESOURCE_PROLIFERATION).")
    payload: dict = Field(..., description="The directive content.")
    signature: str = Field(..., description="Cryptographic signature from the Super Director.")
    issued_at: datetime = Field(default_factory=datetime.now)

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class DirectorIdentity(BaseModel):
    """
    Cryptographic identity markers for a TNF Director.
    """
    nft_id: str = Field(..., description="The unique NFT ID representing the Director's authority.")
    wallet_address: str = Field(..., description="The blockchain wallet address bound to the Director NFT.")
    signing_public_key_pem: str = Field(..., description="SPKI PEM format Ed25519 public key.")
    encryption_public_key_pem: str = Field(..., description="SPKI PEM format X25519 public key.")

class SuperDirectorInjection(BaseModel):
    """
    Payload for a prompt injection from the Super Director.
    """
    directive: str = Field("SUPER_DIRECTOR_INJECTION", description="The directive type.")
    content: str = Field(..., description="The instruction or prompt to be injected into the swarm.")
    priority: str = Field("medium", description="Priority level: low, medium, high, critical.")
    issuer: str = Field(..., description="The NFT ID of the issuing Director.")
    timestamp: datetime = Field(default_factory=datetime.now, description="Issuance timestamp.")

class SubDirectorState(BaseModel):
    """
    The internal state of a Local Sub-Director.
    """
    actor_id: str = Field(..., description="The local actor ID (e.g., tty-s005).")
    identity: DirectorIdentity = Field(..., description="The authorized NFT identity.")
    last_sync_at: Optional[datetime] = Field(None, description="Last successful synchronization with the Super Director.")
    is_active: bool = Field(True, description="Whether the Sub-Director is currently monitoring its lane.")

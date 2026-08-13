"""
Arweave & AO Memory Agent

This agent handles permanent storage, immutable audit logging, and state management
using Arweave (permanent storage) and AO (the hyper-parallel computer).

Division: 7.0 Crypto Operations
Protocol: Arweave + AO (Layer 4 - Memory)
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import List, Dict, Optional, Literal, Any
from datetime import datetime

# ===== Input Models =====

class ArweaveStorageInput(BaseModel):
    """
    Input for storing data permanently on Arweave.
    """
    data_type: Literal["audit_log", "agent_state", "nft_metadata", "document", "binary"] = Field(
        ...,
        description="Type of data being stored"
    )
    content: str = Field(..., description="Data content (JSON string for structured data)")
    tags: Dict[str, str] = Field(default_factory=dict, description="Metadata tags for searchability")
    content_type: str = Field("application/json", description="MIME type of content")
    encrypt: bool = Field(False, description="Whether to encrypt data before storage")


class AuditLogEntry(BaseModel):
    """
    Structured audit log entry.
    """
    event_type: str = Field(..., description="Type of event (e.g., 'TRANSACTION', 'STATE_CHANGE')")
    event_data: Dict[str, Any] = Field(..., description="Event-specific data")
    actor: str = Field(..., description="Agent or user who triggered the event")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    severity: Literal["info", "warning", "error", "critical"] = Field("info", description="Log severity")
    tags: Dict[str, str] = Field(default_factory=dict, description="Additional metadata")


class AOStateManagementInput(BaseModel):
    """
    Input for managing state on AO (the hyper-parallel computer).
    """
    process_id: str = Field(..., description="AO process identifier")
    action: Literal["save_state", "load_state", "update_state", "delete_state"] = Field(
        ...,
        description="State management action"
    )
    state_data: Optional[Dict[str, Any]] = Field(None, description="State data to save/update")
    state_key: Optional[str] = Field(None, description="Specific state key to operate on")


class MemoryQueryInput(BaseModel):
    """
    Input for querying stored data from Arweave.
    """
    query_type: Literal["by_tag", "by_address", "by_transaction", "by_content"] = Field(
        ...,
        description="Type of query to perform"
    )
    filters: Dict[str, str] = Field(..., description="Query filters (e.g., tags, address)")
    limit: int = Field(10, ge=1, le=100, description="Maximum number of results")
    sort_order: Literal["asc", "desc"] = Field("desc", description="Sort order by timestamp")


# ===== Output Models =====

class ArweaveTransaction(BaseModel):
    """
    Details of an Arweave transaction.
    """
    tx_id: str = Field(..., description="Arweave transaction ID")
    data_hash: str = Field(..., description="SHA-256 hash of stored data")
    data_size_bytes: int = Field(..., description="Size of stored data")
    block_height: Optional[int] = Field(None, description="Block where transaction was mined")
    confirmations: int = Field(0, description="Number of confirmations")

    # URLs
    gateway_url: HttpUrl = Field(..., description="Gateway URL to access data")
    explorer_url: HttpUrl = Field(..., description="Block explorer URL")

    # Cost information
    cost_ar: str = Field(..., description="Storage cost in AR tokens")
    cost_usd: str = Field(..., description="Storage cost in USD")
    cost_per_mb: str = Field(..., description="Cost per megabyte")

    # Metadata
    tags: Dict[str, str] = Field(default_factory=dict, description="Transaction tags")
    content_type: str = Field(..., description="Content MIME type")
    timestamp: datetime = Field(..., description="Transaction timestamp")

    # Storage
    permanent: bool = Field(True, description="Whether storage is permanent (always true for Arweave)")
    retrievable: bool = Field(True, description="Whether data is currently retrievable")


class StorageResult(BaseModel):
    """
    Result of a storage operation.
    """
    status: Literal["pending", "confirmed", "failed"] = Field(..., description="Storage operation status")
    transaction: ArweaveTransaction = Field(..., description="Arweave transaction details")

    # Access information
    data_url: HttpUrl = Field(..., description="Direct URL to access stored data")
    ipfs_mirror: Optional[HttpUrl] = Field(None, description="IPFS mirror URL (if available)")

    # Verification
    data_hash: str = Field(..., description="SHA-256 hash for verification")
    signature: str = Field(..., description="Cryptographic signature")

    # Estimated permanence
    estimated_lifespan_years: int = Field(200, description="Estimated data permanence (Arweave guarantees 200+ years)")


class AOProcessState(BaseModel):
    """
    State of an AO process.
    """
    process_id: str = Field(..., description="AO process identifier")
    state_version: int = Field(..., description="State version number")
    state_data: Dict[str, Any] = Field(..., description="Current state data")

    # State metadata
    last_updated: datetime = Field(..., description="Last state update timestamp")
    updated_by: str = Field(..., description="Entity that last updated state")
    state_size_kb: float = Field(..., description="State size in kilobytes")

    # AO-specific
    message_id: str = Field(..., description="AO message ID that created/updated this state")
    arweave_tx_id: str = Field(..., description="Underlying Arweave transaction ID")

    # Verification
    state_hash: str = Field(..., description="Hash of state data")
    merkle_root: str = Field(..., description="Merkle root for state verification")


class AuditLogResult(BaseModel):
    """
    Result of storing an audit log entry.
    """
    log_id: str = Field(..., description="Unique log entry identifier")
    stored_on_arweave: bool = Field(..., description="Whether log was stored on Arweave")
    arweave_tx: Optional[ArweaveTransaction] = Field(None, description="Arweave transaction details")

    # Log details
    event_type: str = Field(..., description="Type of event logged")
    timestamp: datetime = Field(..., description="Event timestamp")
    severity: str = Field(..., description="Log severity")

    # Immutability guarantee
    immutable: bool = Field(True, description="Whether log is immutable")
    tamper_proof: bool = Field(True, description="Whether log is tamper-proof")
    cryptographically_signed: bool = Field(True, description="Whether log is cryptographically signed")


class QueryResult(BaseModel):
    """
    Result of a memory query operation.
    """
    query_type: str = Field(..., description="Type of query performed")
    results_found: int = Field(..., description="Number of results found")

    # Results
    transactions: List[ArweaveTransaction] = Field(default_factory=list, description="Matching transactions")

    # Query metadata
    query_time_ms: float = Field(..., description="Query execution time in milliseconds")
    cache_hit: bool = Field(False, description="Whether result was cached")

    # Pagination
    has_more: bool = Field(False, description="Whether more results are available")
    next_cursor: Optional[str] = Field(None, description="Cursor for next page of results")


class DataRetrievalResult(BaseModel):
    """
    Result of retrieving data from Arweave.
    """
    tx_id: str = Field(..., description="Transaction ID of retrieved data")
    content: str = Field(..., description="Retrieved data content")
    content_type: str = Field(..., description="Content MIME type")

    # Verification
    data_hash: str = Field(..., description="SHA-256 hash of data")
    hash_verified: bool = Field(..., description="Whether hash matches stored hash")
    signature_verified: bool = Field(..., description="Whether signature is valid")

    # Metadata
    tags: Dict[str, str] = Field(default_factory=dict, description="Transaction tags")
    block_height: int = Field(..., description="Block where data was stored")
    age_days: int = Field(..., description="Age of data in days")

    # Retrieval
    retrieval_time_ms: float = Field(..., description="Time taken to retrieve data")
    source: Literal["gateway", "cache", "peer"] = Field(..., description="Data source")


# ===== Agent Metadata =====

class ArweaveMemoryAgentMetadata(BaseModel):
    """
    Metadata describing the Arweave & AO Memory Agent's capabilities.
    """
    agent_name: str = "arweave-memory-agent"
    version: str = "1.0.0"
    description: str = Field(
        default="Manages permanent storage and state using Arweave (the permaweb) and AO "
        "(the hyper-parallel computer). Provides immutable audit logging, state management, "
        "and permanent data storage with cryptographic verification. Perfect for compliance, "
        "auditability, and building transparent autonomous systems."
    )

    capabilities: List[str] = Field(default=[
        "Permanent data storage (200+ year guarantee)",
        "Immutable audit logging",
        "State management via AO",
        "Cryptographic verification",
        "Decentralized data retrieval",
        "Content addressing",
        "Tamper-proof records",
        "Query and search"
    ])

    storage_guarantees: List[str] = Field(default=[
        "Permanent (200+ years)",
        "Immutable (cannot be altered)",
        "Decentralized (no single point of failure)",
        "Cryptographically signed",
        "Globally accessible",
        "Censorship-resistant"
    ])

    typical_use_cases: List[str] = Field(default=[
        "Agent action audit logs",
        "NFT metadata storage",
        "Compliance documentation",
        "Autonomous system state",
        "Transaction records",
        "Data provenance",
        "Legal records",
        "Research data archival"
    ])

    input_models: List[str] = Field(default=[
        "ArweaveStorageInput",
        "AuditLogEntry",
        "AOStateManagementInput",
        "MemoryQueryInput"
    ])

    output_models: List[str] = Field(default=[
        "StorageResult",
        "AOProcessState",
        "AuditLogResult",
        "QueryResult",
        "DataRetrievalResult"
    ])

    integration_notes: List[str] = Field(default=[
        "All agent actions should be logged to Arweave for auditability",
        "State should be checkpointed to AO for recoverability",
        "NFT metadata must be stored on Arweave before minting",
        "Compliance requires immutable audit trail"
    ])

    llm_consumable_description: str = Field(
        default="I provide permanent storage and immutable audit logging using Arweave and AO. "
        "Tell me what you need to store or log (e.g., 'Log this transaction', 'Store agent state', "
        "'Save NFT metadata permanently') and I'll handle encryption, verification, and permanent storage. "
        "All data is immutable, cryptographically signed, and guaranteed permanent for 200+ years. "
        "Perfect for compliance, auditability, and transparent autonomous systems."
    )

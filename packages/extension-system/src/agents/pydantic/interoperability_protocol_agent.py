from pydantic import BaseModel, Field, HttpUrl
from typing import List, Dict, Any

class InteroperabilityInput(BaseModel):
    """
    Input for discovering and cataloging a new agent or MCP server.
    """
    endpoint_url: HttpUrl = Field(..., description="The discovery endpoint of the new agent or MCP server.")
    source_code_url: HttpUrl | None = Field(default=None, description="Optional URL to the source code for static analysis.")

class StandardizedCapability(BaseModel):
    """
    A single capability of an agent or tool, translated into a standardized format.
    """
    name: str
    description: str
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]

class CapabilityCatalogEntry(BaseModel):
    """
    A complete entry for a newly discovered agent or server in the central catalog.
    """
    entry_id: str
    entry_type: str = Field(..., description="The type of entity (e.g., 'A2A Agent', 'MCP Server').")
    name: str
    description: str
    capabilities: List[StandardizedCapability]
    llm_consumable_description: str = Field(..., description="A natural language summary of all capabilities, for use by the Orchestrator.")
    status: str = Field(default="Registered and Active")
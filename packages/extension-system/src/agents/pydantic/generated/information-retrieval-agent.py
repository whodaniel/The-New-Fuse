from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class InformationRetrievalAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class InformationRetrievalAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class InformationRetrievalAgentMetadata(AgentMetadataBase):
    agent_id: str = "information-retrieval-agent"
    name: str = "information-retrieval-agent"
    description: str = "MUST BE USED for complex queries requiring deep information synthesis. It operationalizes the 'Semantic Chunk Protocol' by deconstructing queries, retrieving 'Information Shards' from multiple sources, and structuring them into semantically clustered, categorized outputs."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="VectorDatabaseAPI", description="", version="1.0.0"), AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["WebSearch", "VectorDatabaseAPI"]
    tags: List[str] = []
    system_prompt: str = "You are a Research Intelligence Analyst operating under the principles of Dr.\nEvelyn Reed's \"Semantic Chunk Protocol\" and Gemini's theory of \"Epistemic\nAgility.\" You do not just find links; you deconstruct complex information needs\nand restructure raw data into synthesized knowledge.\n\nYour operational workflow is as follows:\n\n1.  **Query Decomposition (Probabilistic Intent Factoring):** Receive the\n    `InformationRetrievalInput`. Analyze the `master_query` to deconstruct it\n    into a set of distinct `deconstructed_intents` or sub-queries.\n2.  **Parallel Retrieval:** For each sub-query, retrieve raw information from\n    the specified `retrieval_sources`.\n3.  **Shard Extraction:** Process the retrieved documents, breaking them down\n    into discrete, semantically self-contained `InformationShards`. For each\n    shard, generate a `semantic_embedding` using a vectorization model.\n4.  **Semantic Clustering (Geometric Partitioning):** Analyze the semantic\n    embeddings of all collected shards. Group them into thematic\n    `SemanticClusters` based on cosine similarity in the vector space.\n5.  **Topic Abstraction (Bayesian Inference):** For each cluster, generate a\n    concise, human-readable `cluster_label` and a more detailed\n    `cluster_summary` that synthesizes the information contained within the\n    shards.\n6.  **Generate Report:** Assemble the deconstructed intents and the final\n    semantic clusters into the `CategorizedOutputReport` Pydantic model. This\n    provides the user with a structured, multi-faceted understanding of their\n    query, rather than a simple list of results. The output must be a single,\n    valid JSON object."
    input_model: str = "InformationRetrievalAgentInput"
    output_model: str = "InformationRetrievalAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "InformationRetrievalAgentInput",
    "InformationRetrievalAgentOutput",
    "InformationRetrievalAgentMetadata",
]

from pydantic import BaseModel, Field, HttpUrl
from typing import List, Dict

class InformationRetrievalInput(BaseModel):
    """
    Input for a complex information retrieval and synthesis task.
    """
    master_query: str = Field(..., description="A complex, multi-faceted query from a user.")
    retrieval_sources: List[str] = Field(..., description="A list of sources to query (e.g., 'WebSearch', 'VectorDatabase', 'InternalDocs').")

class InformationShard(BaseModel):
    """
    Represents a discrete, semantically self-contained chunk of information, as per the Semantic Chunk Protocol.
    """
    shard_id: str
    source_url: HttpUrl
    content_chunk: str = Field(..., description="The specific text snippet retrieved.")
    semantic_embedding: List[float] = Field(..., description="The k-dimensional vector representation of the content chunk.")

class SemanticCluster(BaseModel):
    """
    Represents a semantic group of related information shards.
    """
    cluster_id: str
    cluster_label: str = Field(..., description="A human-readable label for the thematic group.")
    cluster_summary: str = Field(..., description="An AI-generated summary of the information contained in the cluster.")
    contained_shards: List[InformationShard]

class CategorizedOutputReport(BaseModel):
    """
    The final, structured output that synthesizes information according to the Semantic Chunk Protocol.
    """
    original_query: str
    deconstructed_intents: List[str] = Field(..., description="The sub-intents that the master query was broken down into.")
    semantic_clusters: List[SemanticCluster] = Field(..., description="The final categorized output, with information grouped by theme.")
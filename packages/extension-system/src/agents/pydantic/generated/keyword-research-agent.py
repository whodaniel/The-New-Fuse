from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class KeywordResearchAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class KeywordResearchAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class KeywordResearchAgentMetadata(AgentMetadataBase):
    agent_id: str = "keyword-research-agent"
    name: str = "keyword-research-agent"
    description: str = "MUST BE USED to conduct in-depth keyword research for a blog's content strategy. Identifies long-tail and 'Gold Nugget' keywords and analyzes SERPs to determine search intent."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = [AgentCapability(name="KeywordToolAPI", description="", version="1.0.0"), AgentCapability(name="WebSearch", description="", version="1.0.0")]
    tools: List[str] = ["KeywordToolAPI", "WebSearch"]
    tags: List[str] = []
    system_prompt: str = "You are an expert SEO strategist with a deep understanding of keyword theory and\ncontent marketing. Your primary function is to build a robust content strategy\nby identifying valuable keywords.\n\nYour operational workflow is as follows:\n\n1.  **Analyze Input:** Receive and parse the `KeywordResearchInput`. Use the\n    `niche` and `audience_pain_points` as seed topics for your research.\n2.  **Identify Long-Tail Keywords:** Use the `KeywordToolAPI` to generate a\n    broad list of keywords related to the seed topics. Filter this list to\n    identify \"long-tail\" and \"Gold Nugget Keywords\"—terms with sufficient search\n    volume but lower competition, which are ideal for a new blog.\n3.  **Analyze SERP for Intent:** For the most promising keywords, use\n    `WebSearch` to analyze the Search Engine Results Page (SERP). Determine the\n    user's search intent (e.g., informational \"how-to\" guides vs. transactional\n    \"best of\" reviews). This is critical for guiding content creation.\n4.  **Categorize and Score:** Categorize each keyword based on its type and\n    search intent. Use data from the `KeywordToolAPI` to populate the search\n    volume and competition level.\n5.  **Generate Report:** Compile all findings into the final\n    `KeywordResearchReport` Pydantic model. The report should provide a clear\n    and actionable list of keywords that will form the basis of the editorial\n    calendar. The output must be a single, valid JSON object."
    input_model: str = "KeywordResearchAgentInput"
    output_model: str = "KeywordResearchAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "KeywordResearchAgentInput",
    "KeywordResearchAgentOutput",
    "KeywordResearchAgentMetadata",
]

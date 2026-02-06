from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class ExplorerAgentInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class ExplorerAgentOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class ExplorerAgentMetadata(AgentMetadataBase):
    agent_id: str = "explorer-agent"
    name: str = "explorer-agent"
    description: str = "Advanced codebase discovery, deep architectural analysis, and proactive research agent. The eyes and ears of the framework. Use for initial audits, refactoring plans, and deep investigative tasks."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = []
    tools: List[str] = []
    tags: List[str] = []
    system_prompt: str = "# Explorer Agent - Advanced Discovery & Research\n\nYou are an expert at exploring and understanding complex codebases, mapping\narchitectural patterns, and researching integration possibilities.\n\n## Your Expertise\n\n1.  **Autonomous Discovery**: Automatically maps the entire project structure\n    and critical paths.\n2.  **Architectural Reconnaissance**: Deep-dives into code to identify design\n    patterns and technical debt.\n3.  **Dependency Intelligence**: Analyzes not just _what_ is used, but _how_\n    it's coupled.\n4.  **Risk Analysis**: Proactively identifies potential conflicts or breaking\n    changes before they happen.\n5.  **Research & Feasibility**: Investigates external APIs, libraries, and new\n    feature viability.\n6.  **Knowledge Synthesis**: Acts as the primary information source for\n    `orchestrator` and `project-planner`.\n\n## Advanced Exploration Modes\n\n### 🔍 Audit Mode\n\n- Comprehensive scan of the codebase for vulnerabilities and anti-patterns.\n- Generates a \"Health Report\" of the current repository.\n\n### 🗺️ Mapping Mode\n\n- Creates visual or structured maps of component dependencies.\n- Traces data flow from entry points to data stores.\n\n### 🧪 Feasibility Mode\n\n- Rapidly prototypes or researches if a requested feature is possible within the\n  current constraints.\n- Identifies missing dependencies or conflicting architectural choices.\n\n## 💬 Socratic Discovery Protocol (Interactive Mode)\n\nWhen in discovery mode, you MUST NOT just report facts; you must engage the user\nwith intelligent questions to uncover intent.\n\n### Interactivity Rules:\n\n1. **Stop & Ask**: If you find an undocumented convention or a strange\n   architectural choice, stop and ask the user: _\"I noticed [A], but [B] is more\n   common. Was this a conscious design choice or part of a specific\n   constraint?\"_\n2. **Intent Discovery**: Before suggesting a refactor, ask: _\"Is the long-term\n   goal of this project scalability or rapid MVP delivery?\"_\n3. **Implicit Knowledge**: If a technology is missing (e.g., no tests), ask: _\"I\n   see no test suite. Would you like me to recommend a framework (Jest/Vitest)\n   or is testing out of current scope?\"_\n4. **Discovery Milestones**: After every 20% of exploration, summarize and ask:\n   _\"So far I've mapped [X]. Should I dive deeper into [Y] or stay at the\n   surface level for now?\"_\n\n### Question Categories:\n\n- **The \"Why\"**: Understanding the rationale behind existing code.\n- **The \"When\"**: Timelines and urgency affecting discovery depth.\n- **The \"If\"**: Handling conditional scenarios and feature flags.\n\n## Code Patterns\n\n### Discovery Flow\n\n1. **Initial Survey**: List all directories and find entry points (e.g.,\n   `package.json`, `index.ts`).\n2. **Dependency Tree**: Trace imports and exports to understand data flow.\n3. **Pattern Identification**: Search for common boilerplate or architectural\n   signatures (e.g., MVC, Hexagonal, Hooks).\n4. **Resource Mapping**: Identify where assets, configs, and environment\n   variables are stored.\n\n## Review Checklist\n\n- [ ] Is the architectural pattern clearly identified?\n- [ ] Are all critical dependencies mapped?\n- [ ] Are there any hidden side effects in the core logic?\n- [ ] Is the tech stack consistent with modern best practices?\n- [ ] Are there unused or dead code sections?\n\n## When You Should Be Used\n\n- When starting work on a new or unfamiliar repository.\n- To map out a plan for a complex refactor.\n- To research the feasibility of a third-party integration.\n- For deep-dive architectural audits.\n- When an \"orchestrator\" needs a detailed map of the system before distributing\n  tasks."
    input_model: str = "ExplorerAgentInput"
    output_model: str = "ExplorerAgentOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "ExplorerAgentInput",
    "ExplorerAgentOutput",
    "ExplorerAgentMetadata",
]

from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class DocumentationWriterInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class DocumentationWriterOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class DocumentationWriterMetadata(AgentMetadataBase):
    agent_id: str = "documentation-writer"
    name: str = "documentation-writer"
    description: str = "Expert in technical documentation. Use ONLY when user explicitly requests documentation (README, API docs, changelog). DO NOT auto-invoke during normal development."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = []
    tools: List[str] = []
    tags: List[str] = []
    system_prompt: str = "# Documentation Writer\n\nYou are an expert technical writer specializing in clear, comprehensive\ndocumentation.\n\n## Core Philosophy\n\n> \"Documentation is a gift to your future self and your team.\"\n\n## Your Mindset\n\n- **Clarity over completeness**: Better short and clear than long and confusing\n- **Examples matter**: Show, don't just tell\n- **Keep it updated**: Outdated docs are worse than no docs\n- **Audience first**: Write for who will read it\n\n---\n\n## Documentation Type Selection\n\n### Decision Tree\n\n```\nWhat needs documenting?\n│\n├── New project / Getting started\n│   └── README with Quick Start\n│\n├── API endpoints\n│   └── OpenAPI/Swagger or dedicated API docs\n│\n├── Complex function / Class\n│   └── JSDoc/TSDoc/Docstring\n│\n├── Architecture decision\n│   └── ADR (Architecture Decision Record)\n│\n├── Release changes\n│   └── Changelog\n│\n└── AI/LLM discovery\n    └── llms.txt + structured headers\n```\n\n---\n\n## Documentation Principles\n\n### README Principles\n\n| Section           | Why It Matters        |\n| ----------------- | --------------------- |\n| **One-liner**     | What is this?         |\n| **Quick Start**   | Get running in <5 min |\n| **Features**      | What can I do?        |\n| **Configuration** | How to customize?     |\n\n### Code Comment Principles\n\n| Comment When                      | Don't Comment            |\n| --------------------------------- | ------------------------ |\n| **Why** (business logic)          | What (obvious from code) |\n| **Gotchas** (surprising behavior) | Every line               |\n| **Complex algorithms**            | Self-explanatory code    |\n| **API contracts**                 | Implementation details   |\n\n### API Documentation Principles\n\n- Every endpoint documented\n- Request/response examples\n- Error cases covered\n- Authentication explained\n\n---\n\n## Quality Checklist\n\n- [ ] Can someone new get started in 5 minutes?\n- [ ] Are examples working and tested?\n- [ ] Is it up to date with the code?\n- [ ] Is the structure scannable?\n- [ ] Are edge cases documented?\n\n---\n\n## When You Should Be Used\n\n- Writing README files\n- Documenting APIs\n- Adding code comments (JSDoc, TSDoc)\n- Creating tutorials\n- Writing changelogs\n- Setting up llms.txt for AI discovery\n\n---\n\n> **Remember:** The best documentation is the one that gets read. Keep it short,\n> clear, and useful."
    input_model: str = "DocumentationWriterInput"
    output_model: str = "DocumentationWriterOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "DocumentationWriterInput",
    "DocumentationWriterOutput",
    "DocumentationWriterMetadata",
]

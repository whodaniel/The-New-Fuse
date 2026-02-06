from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class TestEngineerInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class TestEngineerOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class TestEngineerMetadata(AgentMetadataBase):
    agent_id: str = "test-engineer"
    name: str = "test-engineer"
    description: str = "Expert in testing, TDD, and test automation. Use for writing tests, improving coverage, debugging test failures. Triggers on test, spec, coverage, jest, pytest, playwright, e2e, unit test."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = []
    tools: List[str] = []
    tags: List[str] = []
    system_prompt: str = "# Test Engineer\n\nExpert in test automation, TDD, and comprehensive testing strategies.\n\n## Core Philosophy\n\n> \"Find what the developer forgot. Test behavior, not implementation.\"\n\n## Your Mindset\n\n- **Proactive**: Discover untested paths\n- **Systematic**: Follow testing pyramid\n- **Behavior-focused**: Test what matters to users\n- **Quality-driven**: Coverage is a guide, not a goal\n\n---\n\n## Testing Pyramid\n\n```\n        /\\          E2E (Few)\n       /  \\         Critical user flows\n      /----\\\n     /      \\       Integration (Some)\n    /--------\\      API, DB, services\n   /          \\\n  /------------\\    Unit (Many)\n                    Functions, logic\n```\n\n---\n\n## Framework Selection\n\n| Language   | Unit            | Integration | E2E        |\n| ---------- | --------------- | ----------- | ---------- |\n| TypeScript | Vitest, Jest    | Supertest   | Playwright |\n| Python     | Pytest          | Pytest      | Playwright |\n| React      | Testing Library | MSW         | Playwright |\n\n---\n\n## TDD Workflow\n\n```\n🔴 RED    → Write failing test\n🟢 GREEN  → Minimal code to pass\n🔵 REFACTOR → Improve code quality\n```\n\n---\n\n## Test Type Selection\n\n| Scenario       | Test Type      |\n| -------------- | -------------- |\n| Business logic | Unit           |\n| API endpoints  | Integration    |\n| User flows     | E2E            |\n| Components     | Component/Unit |\n\n---\n\n## AAA Pattern\n\n| Step        | Purpose          |\n| ----------- | ---------------- |\n| **Arrange** | Set up test data |\n| **Act**     | Execute code     |\n| **Assert**  | Verify outcome   |\n\n---\n\n## Coverage Strategy\n\n| Area           | Target    |\n| -------------- | --------- |\n| Critical paths | 100%      |\n| Business logic | 80%+      |\n| Utilities      | 70%+      |\n| UI layout      | As needed |\n\n---\n\n## Deep Audit Approach\n\n### Discovery\n\n| Target     | Find                 |\n| ---------- | -------------------- |\n| Routes     | Scan app directories |\n| APIs       | Grep HTTP methods    |\n| Components | Find UI files        |\n\n### Systematic Testing\n\n1. Map all endpoints\n2. Verify responses\n3. Cover critical paths\n\n---\n\n## Mocking Principles\n\n| Mock            | Don't Mock      |\n| --------------- | --------------- |\n| External APIs   | Code under test |\n| Database (unit) | Simple deps     |\n| Network         | Pure functions  |\n\n---\n\n## Review Checklist\n\n- [ ] Coverage 80%+ on critical paths\n- [ ] AAA pattern followed\n- [ ] Tests are isolated\n- [ ] Descriptive naming\n- [ ] Edge cases covered\n- [ ] External deps mocked\n- [ ] Cleanup after tests\n- [ ] Fast unit tests (<100ms)\n\n---\n\n## Anti-Patterns\n\n| ❌ Don't            | ✅ Do          |\n| ------------------- | -------------- |\n| Test implementation | Test behavior  |\n| Multiple asserts    | One per test   |\n| Dependent tests     | Independent    |\n| Ignore flaky        | Fix root cause |\n| Skip cleanup        | Always reset   |\n\n---\n\n## When You Should Be Used\n\n- Writing unit tests\n- TDD implementation\n- E2E test creation\n- Improving coverage\n- Debugging test failures\n- Test infrastructure setup\n- API integration tests\n\n---\n\n> **Remember:** Good tests are documentation. They explain what the code should\n> do."
    input_model: str = "TestEngineerInput"
    output_model: str = "TestEngineerOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "TestEngineerInput",
    "TestEngineerOutput",
    "TestEngineerMetadata",
]

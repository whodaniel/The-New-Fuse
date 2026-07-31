`[CLASS:PRIME] [STATUS:PENDING] [DOC_TYPE:TECHNICAL_DOSSIER] [VISIBILITY:COLLECTIVE]`

# The New Fuse Agentic Framework: Technical Architecture & Protocol Manual

**Primary Author of Intellectual Property:** Daniel Goldberg **Original DACC
Specification Date:** October 26, 2023 (v1.0.0) **This Consolidated Manual:**
Documentation Version 1.0 (Final Draft)

## ⚠️ Implementation Status (added 2026-07-23, do not remove)

**None of the architecture described in this document exists as running code in
this repository.** This was discovered while investigating why TNF's governance
docs describe policies (like mandatory delegation-checking) that have no
enforcing code anywhere. This document itself was found to be sitting only in a
set of Google Docs, never previously codified into the repo — a direct violation
of `DIRECTIVES.md` D3 ("Non-Temporal Proliferation": any solidified learning
must be extracted from an isolated context and codified into shared TNF docs).
Archiving it here fixes that, but does **not** mean any of it has been built.

Specifically, as of 2026-07-23:

- No `AgentDefinition`/`WorkflowDefinition`/`SystemBlueprint` Pydantic schemas
  exist anywhere in `scripts/` or `src/`.
- No `AgentFactory`, `Orchestrator Controller`, `Agent Execution Controller`,
  `Code Execution Controller`, or `FirebaseToolExecutor` exists.
- No Genesis Agent exists.
- The repo's actual persistence layer is **Drizzle**, not the **Prisma** schema
  this manual's Section 7 describes integrating against. A separate,
  partially-captured document ("TNF Agent Protocol Quick Reference (DACC) v3 —
  drift-aware", seeded 2026-02-08) already flagged this exact drift; that doc
  should be located and archived alongside this one as a follow-up.
- The repo is TypeScript-first throughout (NestJS/Node), not just at the API
  Gateway boundary as this manual's hybrid architecture (§4) describes — the
  Python runtime layer (Orchestrator, Agent Execution Controller, Tool
  Controllers) was never started.
- What the repo _does_ have, built independently and organically over 2026, is a
  large, different multi-agent system: Redis pub/sub-driven wrappers
  (`pi-redis-wrapper.cjs`, `jules-redis-wrapper.cjs`,
  `gemini-redis-wrapper.cjs`) built on a shared `RedisAgentClient`
  (`scripts/tnf-agent-cli.cjs`), ~190 markdown agent personas in
  `.claude/agents/` (matched today only by an LLM reading `description`
  frontmatter — no code-based capability index), a heartbeat/cron swarm
  (`scripts/runtime/terminal-heartbeat-pulse.cjs` and friends), and a
  documentation-heavy governance layer (`DIRECTIVES.md` et al.) — none of which
  cross-references this manual's design.

This manual is preserved in full below as the authoritative statement of
**vision**, not current state. Building any real slice of it (starting with
Phase 0) is a separate, multi-month initiative that needs its own dedicated
planning pass — see `docs/protocols/DACC_POML_MCP_A2A_INTEGRATION_BLUEPRINT.md`
for the companion document on how POML, MCP, and A2A layer into this
architecture, and `DIRECTIVES.md` D22 for the one small, real, TypeScript-native
step taken toward it so far (a delegation-preference check, not the full DACC
runtime).

---

## Table of Contents

1. Abstract & Core Philosophy
2. The Layered DACC Architecture
3. The Genesis Layer: Autonomous System Design
4. System Implementation in a Modern Stack
5. Advanced Tooling & Execution Environments
6. Real-time Communication: SSE & Streaming
7. Prisma Database Integration Guide
8. Appendix: Core Pydantic Schemas
9. Appendix: Original DACC Protocol Specification v1.0.0 (2023-10-26, full text)
10. Appendix: Implementation Roadmap (Phase 0 – Phase 4)

---

## 1. Abstract & Core Philosophy

The New Fuse Agentic Framework is a comprehensive ecosystem for building,
orchestrating, and autonomously creating sophisticated AI agents and multi-agent
systems. It is designed for maximum flexibility, scalability, and observability,
enabling complex workflows that can interact with code, external APIs, and
real-time data streams.

### 1.1. The DACC Protocol

At the heart of the framework is the **Dynamic Agent Composition and
Communication (DACC) Protocol**. DACC is a schema-driven architecture that
formalizes how agents and workflows are defined, instantiated, and communicate.
It provides the foundational language and structure for the entire system.

### 1.2. Core Design Principles

- **Schema-First Design:** All components (agents, workflows, tools) are defined
  by declarative, validated Pydantic schemas. The schema _is_ the contract.
- **Declarative Over Imperative:** Workflows and agent interactions are
  _described_ as data (JSON), not _coded_ as logic. This separates the "what"
  from the "how," enabling visual editors and autonomous generation.
- **Decoupled Parsing and Validation:** A two-stage process (`lark` for flexible
  parsing, `Pydantic` for strict validation) makes the system tolerant of LLM
  quirks while ensuring final data integrity.
- **Dynamic Instantiation:** Agents and workflows are not static. They are
  dynamically instantiated from their definitions by a factory, enabling
  programmatic system creation by a "Genesis Agent."
- **Standardized Communication Bus:** All inter-component communication occurs
  via validated Pydantic objects, creating a reliable, type-safe bus that
  eliminates ambiguity.
- **Separation of Concerns:** The UI, API Gateway, and Execution Engine are
  cleanly separated, communicating only through the defined schemas and a
  message queue.

---

## 2. The Layered DACC Architecture

The protocol is composed of declarative definition layers and an active runtime
layer.

### 2.1. Layer 1: The `AgentDefinition` Schema

The blueprint for a single, specialized agent — the "nouns" of the system. It
defines an agent's identity, persona, capabilities, and the precise structure of
its output.

### 2.2. Layer 2: The `WorkflowDefinition` Schema

The "flowchart" of a process — the "verbs" and "sentences" that connect agents.
It declaratively defines the steps, conditional logic, and data flow of a
multi-agent system.

### 2.3. Layer 3: The Runtime & Orchestration Controllers

The execution engine that brings the declarative schemas to life. It is not a
single application but a distributed system of services:

- **AgentFactory:** A component that dynamically creates a runnable `Agent`
  instance from an `AgentDefinition`.
- **Orchestrator Controller:** A stateful service that manages the execution of
  a `WorkflowDefinition`, acting as a state machine.
- **Agent Execution Controller:** A stateless, scalable "worker" service that
  executes a single `WorkflowStep`, handling the LLM call, parsing, and
  validation.
- **Tool Execution Controllers:** Specialized workers for handling specific
  tools like code execution, API calls, or database queries.

---

## 3. The Genesis Layer: Autonomous System Design

This layer elevates the framework from a system for running agents to one that
can _create_ them.

### 3.1. The Genesis Agent

A high-level "meta-agent" whose purpose is to translate a user's goal (expressed
in natural language) into a complete, ready-to-run agentic system. It acts as
the "AI System Architect."

### 3.2. The `SystemBlueprint` Schema

The `OutputModel` for the Genesis Agent. It is a Pydantic schema that contains a
list of new `AgentDefinition`s to be created and a complete `WorkflowDefinition`
to orchestrate them.

### 3.3. The Autonomous Creation Workflow

1. **User Prompt:** A user provides a high-level goal (e.g., "Build a system to
   analyze code and file bug reports").
2. **Genesis Agent Execution:** The Genesis Agent runs, deconstructing the goal
   and designing the necessary agents and workflow.
3. **Blueprint Generation:** The agent outputs a validated `SystemBlueprint`
   object.
4. **System Deployment:** The Orchestrator receives the blueprint and
   programmatically creates the new `AgentDefinition` and `WorkflowDefinition`
   records in the database, making the new system immediately available.

---

## 4. System Implementation in a Modern Stack

The DACC protocol is designed to power a visual, nodal framework using a modern,
decoupled tech stack.

### 4.1. Architectural Overview

`React Flow UI <--> [HTTP/SSE] <--> NestJS API Gateway <--> [Message Queue (e.g., RabbitMQ)] <--> Python Runtime Services`

### 4.2. Frontend (React Flow)

- Provides a visual, nodal interface for building and monitoring workflows.
- Fetches available `AgentDefinition`s from the backend to populate a "node
  palette."
- Serializes the user's graph into a `WorkflowDefinition` JSON object.
- Uses the `EventSource` API to connect to the backend's SSE stream for
  real-time updates.

### 4.3. API Gateway (NestJS)

- The system's control plane and primary entry point.
- Manages persistence of `Agent` and `Workflow` definitions via Prisma.
- Handles user authentication and authorization.
- Initiates workflow runs by dispatching jobs to a message queue.
- Manages SSE connections, subscribing to a Redis Pub/Sub backend to stream
  real-time logs to the client.

### 4.4. Backend Runtime (Python Services & Message Queue)

- The system's execution plane, composed of independently scalable
  microservices.
- **Message Queue (RabbitMQ/Redis Streams):** Decouples the API from the
  execution engine, ensuring resilience and scalability.
- **Orchestrator & Execution Controllers:** Python services that listen to the
  queue and perform the core DACC logic as described in section 2.3.

---

## 5. Advanced Tooling & Execution Environments

The framework enables agents to interact with powerful tools in a secure,
auditable manner.

### 5.1. Core Principle: Decoupling Intent from Execution

An agent never executes code or calls an API directly. It outputs a validated
Pydantic object representing a **request for execution**. The Orchestrator
routes this request to a specialized, secure **Tool Execution Controller**.

### 5.2. Tool: Code Execution Environments (CEE)

- **Purpose:** To provide a secure, sandboxed environment for running
  agent-generated code.
- **Implementation:** A custom, in-house CEE service built on Docker and
  Kubernetes. It exposes an API for creating ephemeral, resource-limited
  containers, executing code within them, and streaming I/O.
- **Hybrid Model:** A "Fuse Connector" application allows the cloud Orchestrator
  to securely route execution requests to a user's local Docker environment,
  enabling interaction with local files and networks.

### 5.3. Tool: Serverless Functions (Firebase Cloud Functions Integration)

- **Purpose:** To allow agents to invoke pre-deployed, event-driven serverless
  functions for common backend tasks (e.g., sending emails, processing
  payments).
- **Implementation:** A `FirebaseToolExecutor` uses the Firebase Admin SDK to
  securely call HTTPS Callable functions. Agents request invocations via a
  `FirebaseFunctionCall` Pydantic schema.

### 5.4. Tool: MCP and Custom Tooling

The framework is extensible. Any external system (like an MCP server) can be
integrated by defining a Pydantic schema for the tool call (e.g., `McpCommand`)
and creating a corresponding Tool Execution Controller that contains the secure
logic for interacting with that tool's SDK or API. See
`DACC_POML_MCP_A2A_INTEGRATION_BLUEPRINT.md` for the fuller MCP/A2A layering
design.

---

## 6. Real-time Communication: SSE & Streaming

To provide transparency and an engaging user experience, the framework is
designed for real-time streaming.

### 6.1. The `StreamPacket` Schema

A standardized Pydantic schema for all real-time messages. It includes an
`event_type` (e.g., `thought`, `token_stream`, `workflow_update`) and a `data`
payload.

### 6.2. Streaming Architecture with Redis Pub/Sub

- **Server-Sent Events (SSE):** The chosen protocol for server-to-client
  communication, managed by the NestJS API Gateway.
- **Redis Pub/Sub:** Used as a high-speed, real-time message bus.
- **Flow:** The Python runtime services publish every `StreamPacket` to a unique
  Redis channel per workflow run. The NestJS gateway subscribes to this channel
  and forwards messages to the client over the open SSE connection.

### 6.3. Frontend Implementation with `EventSource`

The React frontend uses the browser's native `EventSource` API to listen for
named events corresponding to the `StreamPacket` types.

---

## 7. Prisma Database Integration Guide

**(See Implementation Status above — the actual repo uses Drizzle, not Prisma.
This section is preserved as originally written for provenance.)**

### 7.1. Mapping DACC Blueprints to the Schema

- DACC `AgentDefinition` -> Prisma `RegisteredEntity` (type = AGENT); core DACC
  fields stored in the `config` JSON field.
- DACC `WorkflowDefinition` -> Prisma `Workflow.definition` JSON field.

### 7.2. Mapping DACC Instances to the Schema

- Prisma `Agent` represents a user-deployed _instance_, with a foreign key
  (`registeredEntityId`) back to its `RegisteredEntity` blueprint.
- Prisma `WorkflowStep` stores each DACC `WorkflowStep` object (with
  `input_mapping`, `next_steps`, etc.) in its `config` JSON field.

### 7.3. Persisting Execution State and Logs

- `WorkflowExecution.state` (JSON): the Orchestrator persists its full
  `run_state` after every step, for auditability and resume-from-failure.
- `SseEvent`: a permanent, queryable log of all real-time `StreamPacket`s.
- `CodeExecutionUsage`: audit trail for every CEE job.

### 7.4. Summary of Recommended Schema Actions

1. Add `registeredEntityId` to `Agent`.
2. Use `RegisteredEntity.config` for `AgentDefinition` JSON.
3. Use `Workflow.definition` for `WorkflowDefinition` JSON.
4. Add `config` to `WorkflowStep`.
5. Add `state` to `WorkflowExecution`.
6. Use an `SseEvent` table for historical audit.
7. Use Redis for real-time transport, not the database, to avoid bottlenecks.

---

## 8. Appendix: Core Pydantic Schemas

```python
class AgentDefinition(BaseModel):
    agent_name: str
    description: str
    persona: str
    output_schema_code: str
    parsing_grammar: str
    parsing_strategy: Literal['lark', 'instructor'] = 'lark'

class ConditionalNextStep(BaseModel):
    condition: str
    next_step_name: str

class WorkflowStep(BaseModel):
    step_name: str
    agent_name: str
    input_mapping: Dict[str, str] = Field(default_factory=dict)
    next_steps: Optional[List[ConditionalNextStep]] = None
    default_next_step: Optional[str] = None

class WorkflowDefinition(BaseModel):
    workflow_name: str
    description: str
    start_step: str
    steps: List[WorkflowStep]

class SystemBlueprint(BaseModel):
    new_agents_to_create: List[AgentDefinition]
    workflow: WorkflowDefinition

class StreamPacket(BaseModel):
    event_type: Literal[
        "thought", "tool_call", "tool_output", "log_message",
        "token_stream", "workflow_update", "final_output"
    ]
    data: Dict[str, Any]
    step_name: str

class CodeExecutionRequest(BaseModel):
    tool_name: Literal['code_executor'] = 'code_executor'
    environment_type: Literal['python3', 'nodejs', 'bash']
    code_to_execute: str
    packages_to_install: List[str] = Field(default_factory=list)
    timeout_seconds: int = 60
    artifacts_to_retrieve: List[str] = Field(default_factory=list)

class FirebaseFunctionCall(BaseModel):
    tool_name: Literal['firebase_function'] = 'firebase_function'
    function_name: str
    payload: Dict[str, Any] = Field(default_factory=dict)
```

---

## 9. Appendix: Original DACC Protocol Specification v1.0.0 (2023-10-26, full text)

> Preserved verbatim per D16 ("no silent deletes... deprecated facts are
> archived, never silently deleted/overwritten"). This is the original
> specification the rest of this manual expands on.

### The Dynamic Agent Composition and Communication (DACC) Protocol

- **Author of Intellectual Property:** Daniel Goldberg
- **Documentation Date:** October 26, 2023
- **Version:** 1.0.0
- **Framework:** The New Fuse Agentic Framework

#### Abstract

The Dynamic Agent Composition and Communication (DACC) Protocol is a
standardized framework for the definition, creation, and orchestration of
specialized AI agents. It leverages a schema-first design, a two-stage
parsing/validation process, and a dynamic factory model to enable the creation
of robust, composable, and scalable multi-agent systems. This protocol allows
agents to create other agents, each with unique traits, custom communication
patterns, and validated outputs, establishing a reliable "communication bus" for
complex, sequential AI workflows.

#### 1. Executive Summary

Modern AI systems require agents to perform specialized tasks and interact
reliably. The DACC protocol addresses the core challenge of agent brittleness
and communication ambiguity by introducing a formal, structured approach to
agent design and operation.

The key innovation is a decoupled, two-stage process for interpreting a Large
Language Model's (LLM) output:

1. **Flexible Parsing:** A custom `lark` grammar parses the raw, often
   imperfect, text from an LLM into a basic tree structure. This grammar is
   designed to be simple for an LLM to follow and tolerant of common errors.
2. **Strict Validation:** The parsed data is then validated against a strict
   `Pydantic` schema. This step enforces type safety, applies business logic,
   and converts the data into a clean, predictable Python object.

This process, combined with a dynamic `AgentFactory`, allows a "Creator Agent"
or developer to define and instantiate new, specialized agents on the fly, each
with its own unique grammar and output schema. This creates a system where agent
interactions are not based on fragile natural language prompts, but on
validated, machine-readable data structures.

#### 2. Core Philosophy and Design Principles

- **Schema-First Design:** An agent's capabilities, configuration, and output
  are all explicitly defined by a formal schema (`AgentDefinition`). This makes
  the agent's behavior predictable and verifiable.
- **Decoupled Parsing and Validation:** By separating the act of parsing text
  from validating its structure, the system becomes more robust. The parser can
  be forgiving, while the validator remains strict.
- **Dynamic Instantiation:** Agents are not static; they are created dynamically
  from a definition. This allows for programmatic agent creation, enabling
  systems where agents can build new agents to solve novel problems.
- **Standardized Communication Bus:** The protocol mandates that inter-agent
  communication occurs via validated Pydantic objects. This creates a reliable,
  type-safe "bus" that eliminates the ambiguity of natural language
  communication between agents in a chain.
- **Composability and Specialization:** Agents are designed to be expert,
  single-purpose tools. The standardized communication bus allows these simple,
  reliable agents to be chained together into complex and powerful workflows.

#### 3. Architectural Overview

The DACC protocol is composed of three primary components:

1. **The `AgentDefinition` Schema:** A Pydantic model that serves as the
   blueprint for an agent. It contains all the information needed to construct
   and configure a new agent.
2. **The `AgentFactory`:** A static class responsible for ingesting an
   `AgentDefinition` and instantiating a runnable `Agent` instance.
3. **The `Agent` Runtime:** The instantiated object that executes a task. It
   contains the logic to process raw LLM output using its specific parser and
   output model.

**Data Flow Diagram:**

```
[AgentDefinition Object] --(input)--> [AgentFactory] --(instantiates)--> [Runnable Agent Instance]
                                                                                   |
                                                                                   |--(1) Receives raw LLM text
                                                                                   |--(2) Parses with custom Lark grammar
                                                                                   |--(3) Transforms tree to dictionary
                                                                                   |--(4) Validates with custom Pydantic model
                                                                                   |
                                                                                   V
                                                                    [Validated Pydantic Output Object]
```

#### 4. Core Component Specification

##### 4.1. The `AgentDefinition` Schema

This Pydantic model is the cornerstone of the protocol. It defines everything
required to build a new agent.

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class AgentDefinition(BaseModel):
    """
    Defines the static properties and behaviors of a new AI Agent.
    This schema is the blueprint used by the AgentFactory.
    """

    agent_name: str = Field(
        description="A unique, machine-readable name for the agent, e.g., 'SqlWriterAgent'."
    )

    persona: str = Field(
        description="A detailed description of the agent's role, personality, and task. This is used to construct the system prompt for the LLM."
    )

    output_schema_code: str = Field(
        description="A string containing the complete Python code for the Pydantic model that this agent is expected to output. The class must be named 'OutputModel'."
    )

    parsing_grammar: str = Field(
        description="A string containing the complete Lark grammar for parsing the LLM's raw output. The grammar must have a start rule named 'output'."
    )

    tools: List[str] = Field(
        default_factory=list,
        description="An optional list of function/tool names this agent is authorized to call."
    )
```

##### 4.2. The `AgentFactory`

The factory is a static class that handles the dynamic creation of agents. Its
primary method, `create_agent`, performs the following steps:

1. Dynamically executes the `output_schema_code` from the definition to create a
   Pydantic model class in memory.
2. Instantiates a `lark.Lark` parser using the `parsing_grammar` from the
   definition.
3. Initializes and returns a new `Agent` instance, injecting the dynamically
   created model and parser as dependencies.

**Security Note:** The reference implementation uses `exec()`, which can be
unsafe in production if `output_schema_code` comes from an untrusted source. See
Section 11 for safer alternatives.

##### 4.3. The `Agent` Runtime Instance

This is the object that performs the work. It is instantiated by the factory and
is configured with its own unique persona, parser, and output model. Its `run`
method orchestrates the core two-stage parse-and-validate process.

#### 5. Implementation Guide & Example Workflow

##### Step 1: Define a New Agent

```python
code_reviewer_def = AgentDefinition(
    agent_name="CodeReviewerAgent",
    persona="You are a senior software engineer who provides brief, structured feedback on code snippets. Your output must follow the specified grammar exactly.",

    output_schema_code="""
from pydantic import BaseModel, Field
class OutputModel(BaseModel):
    summary: str = Field(description='A one-sentence summary of the feedback.')
    is_blocker: bool = Field(description='Is this a critical, blocking issue?')
    line_number: int = Field(description='The line number the feedback applies to.')
""",

    parsing_grammar=r"""
        ?output: "summary" ":" ESCAPED_STRING "blocker" ":" ("true" | "false") "line" ":" INT

        %import common.ESCAPED_STRING
        %import common.INT
        %import common.WS
        %ignore WS
    """
)
```

##### Step 2: Use the Factory to Create the Agent

```python
reviewer_agent = AgentFactory.create_agent(code_reviewer_def)
```

##### Step 3: Execute the Agent

```python
llm_raw_text = 'summary: "Variable names are not descriptive." blocker: true line: 15'
review_result = reviewer_agent.run(llm_raw_text)
```

##### Step 4: Use the Validated Output

```python
print(review_result.model_dump_json(indent=2))
print(f"Feedback Summary: {review_result.summary}")
print(f"Is it a blocker? {review_result.is_blocker}")
```

#### 6. Appendix: Full Reference Implementation Code

```python
# Required libraries: pip install pydantic lark-parser
from pydantic import BaseModel, Field
from lark import Lark, Transformer, v_args
from typing import Type, List

class AgentDefinition(BaseModel):
    """The blueprint schema for defining a new agent."""
    agent_name: str
    persona: str
    output_schema_code: str
    parsing_grammar: str
    tools: List[str] = Field(default_factory=list)

@v_args(inline=True)
class BasicJsonTransformer(Transformer):
    """A generic transformer to convert Lark parse trees into Python dicts."""
    def string(self, s): return s[1:-1]
    def number(self, n): return int(n)
    def true(self, _): return True
    def false(self, _): return False
    def output(self, *items):
        return {items[i]: items[i+1] for i in range(0, len(items), 2)}

class Agent:
    """A runnable agent instance created by the factory."""
    def __init__(self, definition: AgentDefinition, output_model: Type[BaseModel], parser: Lark):
        self.name = definition.agent_name
        self.system_prompt = f"{definition.persona}. Your output MUST conform to the specified structure and grammar."
        self.output_model = output_model
        self.parser = parser
        self.transformer = BasicJsonTransformer()

    def run(self, raw_llm_output: str) -> BaseModel:
        parsed_tree = self.parser.parse(raw_llm_output)
        transformed_dict = self.transformer.transform(parsed_tree)
        validated_output = self.output_model(**transformed_dict)
        return validated_output

class AgentFactory:
    """A static class to dynamically create agents from definitions."""
    @staticmethod
    def create_agent(definition: AgentDefinition) -> Agent:
        # WARNING: exec() is used for demonstration. Use sandboxing in production.
        local_namespace = {}
        exec_scope = {"BaseModel": BaseModel, "Field": Field}
        exec(definition.output_schema_code, exec_scope, local_namespace)
        output_model_class = local_namespace['OutputModel']
        lark_parser = Lark(definition.parsing_grammar, start='output', parser='lalr')
        return Agent(definition, output_model_class, lark_parser)
```

#### 7. Advanced Concepts and System Architectures

##### 7.1. The Genesis Agent

A "meta-agent" whose primary function is to create other agents.

- **Function:** Receives a complex problem or goal as input; its LLM is prompted
  to think like a system architect.
- **Output:** A `List[AgentDefinition]` — blueprints for the specialized agents
  required to solve the problem.
- **Workflow:** A user submits a goal (e.g., "Analyze customer feedback and
  generate a market trends report"); the Genesis Agent outputs
  `AgentDefinition`s for `DataCollectorAgent`, `SentimentAnalysisAgent`,
  `TopicModelingAgent`, `ReportWriterAgent`; the `AgentFactory` instantiates
  them; an Orchestrator manages execution.

##### 7.2. Hierarchical and Adaptive Workflows

- **Manager-Worker Hierarchy:** A "Manager" agent decomposes a task, spawns
  "Worker" agents via the `AgentFactory`, delegates sub-tasks, and synthesizes
  their validated outputs.
- **Conditional Logic:** A `TriageAgent`'s Pydantic output (e.g., a `priority`
  field) can determine which agent runs next.

#### 8. Inter-Agent Communication Patterns

- **Linear Chain (Pipeline):** Agent A's output is Agent B's direct input.
- **Hub-and-Spoke (Orchestrator Model):** A central Orchestrator Agent
  decomposes a problem, calls specialized "Spoke" agents, and synthesizes
  results.
- **Broadcast / Publish-Subscribe:** An agent publishes output to a message
  board; other agents subscribe to specific `OutputModel` types.

#### 9. Error Handling and Resilience

##### 9.1. Structured Error Models

```python
class AgentErrorModel(BaseModel):
    """A standardized error object for inter-agent communication."""
    error_source_agent: str
    error_type: str  # e.g., "ParsingError", "ValidationError", "ToolExecutionError"
    error_message: str
    original_input: str
```

##### 9.2. Self-Correction and Fallback Agents

- **Retry with Modification:** On an `AgentErrorModel`, the Orchestrator can use
  an LLM to modify the input/prompt and retry.
- **Fallback Agent:** An `ExceptionHandlerAgent` whose `InputModel` is the
  `AgentErrorModel`, deciding whether to notify a human, choose an alternative
  agent, or gracefully terminate.

#### 10. Lifecycle Management and Agent Registry

- **Agent Registry:** A centralized database (SQL/NoSQL/Git-versioned) storing
  and versioning `AgentDefinition` schemas — the "single source of truth" the
  Genesis Agent/Orchestrator query for capabilities.
- **Versioning:** `AgentDefinition` should carry a `version` field so workflows
  can pin to specific agent versions.

#### 11. Security Considerations for Production Environments

The reference implementation's `exec()` is a significant risk if
`output_schema_code` is LLM- or user-provided. Production alternatives:

- **Option 1 (most secure): Pre-defined and Registered Schemas.**
  `output_schema_code` becomes an identifier (e.g.,
  `"schemas.CodeReviewOutput_v1"`) looked up in a secure mapping of allowed
  identifiers to pre-written classes — no arbitrary code execution at all.
- **Option 2: AST Validation.** Parse `output_schema_code` with Python's `ast`
  module; reject any disallowed node (e.g., `Import` of `os`, `Call` to `open`).
- **Option 3: Sandboxed Execution.** Run in a heavily restricted sandbox
  (minimal Docker container, or `RestrictedPython`) with no filesystem access
  and a stripped builtin set.

##### Extension: The Workflow Definition Schema (added to v1.0.0 in follow-up discussion)

The DACC principle of "defining complex entities with a standardized schema"
extends naturally to workflows themselves:

- **Layer 1 (The Agent):** `AgentDefinition` defines the "nouns" — the
  individual actors and their capabilities.
- **Layer 2 (The Workflow):** `WorkflowDefinition` defines the "verbs" — the
  rules of engagement, flow of control, and sequence of operations between
  agents.

```python
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ConditionalNextStep(BaseModel):
    """Defines a conditional transition to the next step."""
    condition: str = Field(
        description="A simple expression to evaluate against the output of the current step. e.g., 'output.is_blocker == true'."
    )
    next_step_name: str = Field(
        description="The name of the step to transition to if the condition is met."
    )

class WorkflowStep(BaseModel):
    """Defines a single step within a workflow."""
    step_name: str = Field(description="A unique name for this step, e.g., 'ReviewCode'.")
    agent_name: str = Field(
        description="The name of the agent to execute for this step. This name would be used to look up an AgentDefinition in a registry."
    )
    input_mapping: Dict[str, Any] = Field(
        default_factory=dict,
        description="Maps the output of previous steps or initial workflow input to the input of this agent. e.g., {'code_snippet': 'workflow_input.code'}"
    )
    next_steps: Optional[List[ConditionalNextStep]] = Field(
        default=None,
        description="A list of conditional paths to take after this step. The first condition to evaluate to true is chosen."
    )
    default_next_step: Optional[str] = Field(
        default=None,
        description="The step to transition to if no conditional paths are met. If this is null and no conditions are met, the workflow ends."
    )

class WorkflowDefinition(BaseModel):
    """A declarative schema for an entire agentic workflow."""
    workflow_name: str = Field(description="A unique name for the workflow, e.g., 'AutomatedCodeReviewAndTicketing'.")
    description: str
    start_step: str = Field(description="The name of the first step to execute in the workflow.")
    steps: List[WorkflowStep]
```

**The Orchestrator** is the runtime engine that acts as a state machine over a
`WorkflowDefinition`: it loads the definition, instantiates required agents via
the `AgentFactory` and an `AgentRegistry`, and steps through the sequence —
executing the current step's agent, evaluating `next_steps` conditions against
its validated output, and transitioning — until an end state is reached,
maintaining a `run_state` dict of all data produced along the way.

**Benefits of this layered approach:** declarative over imperative; clean
separation of concerns (agents don't know about other agents); the workflow is
pure data so it can be visualized/version-controlled; agent reusability across
many workflows; and Pydantic validates workflow structure itself, so the
Orchestrator can catch malformed step references before execution.

##### Extension: The Genesis Layer, MCP tooling, and Code Execution (added to v1.0.0 in follow-up discussion)

The `AgentDefinition`/`WorkflowDefinition` schemas become the **native
language** of a higher-order **Genesis Agent** ("Master Agent") — a natural
language interface to the entire DACC framework. Its `OutputModel` is a
`SystemBlueprint` (`new_agents_to_create: List[AgentDefinition]` +
`workflow: WorkflowDefinition`). A user states a goal in plain language; the
Genesis Agent deconstructs it, defines any new agents needed, designs the
connecting workflow, and outputs a single validated `SystemBlueprint`; the
Orchestrator (or a dedicated deployment service) persists the new
`AgentDefinition`s and `WorkflowDefinition` to their registries, making the
system immediately runnable.

MCP tooling fits DACC's existing "Tool" concept precisely: an agent doesn't
contain a tool's code, it _requests_ the tool's execution. A secure
`execute_mcp_command` wrapper lives in the Agent Execution Controller; a generic
`McpToolAgent`'s `OutputModel` carries `tool_name`, `command`, `params`; when
the Orchestrator receives an agent output containing a `tool_name` field, it
pauses the workflow, dispatches to the appropriate Tool Executor, injects the
result back into `run_state`, and resumes.

**Core architectural principle: decoupling intent from execution.** Agents must
never `exec()` code directly in their own process. Their job is to _write_ code
and _request_ its execution within a specified **Code Execution Environment
(CEE)**; the Orchestrator is the gatekeeper dispatching to a specialized
`Code Execution Controller`. Candidate CEE backends: **E2B** (sandboxed cloud
Firecracker micro-VMs purpose-built for AI agents), **Jupyter Kernel Gateway**
(self-hosted, Jupyter protocol over REST), or **custom Docker/Kubernetes
sandboxes** (maximum isolation, highest effort). A `CodeExecutionRequest` schema
formalizes the request (`environment_type`, `code_to_execute`,
`packages_to_install`, `timeout_seconds`, `artifacts_to_retrieve`); a
`CodeExecutionController` provisions the sandbox, installs packages, executes,
streams stdout/stderr back to the Orchestrator in real time, retrieves
artifacts, and tears the sandbox down.

For a **local, user-facing CEE** (e.g. the Theia IDE), the interaction model
differs: agents get a toolset of functions calling directly into the local IDE
backend's API (`TheiaTerminalCommand`, `TheiaWriteFile`), executed by a
NestJS-hosted Tool Executor against the user's actual workspace.

##### Extension: Custom in-house CEE, hybrid local/cloud execution (added to v1.0.0 in follow-up discussion)

Building an in-house CEE ("in-house E2B") as a standalone multi-tenant
microservice: **Docker** containers, **Kubernetes** for scheduling/scaling, a
**FastAPI** REST layer, **WebSockets** for log streaming. API surface:
`POST /v1/sandboxes/create` (returns `sandbox_id` + log-streaming WS URL),
`POST /v1/sandboxes/{id}/execute`, `GET /v1/sandboxes/{id}/artifacts/{path}`,
`DELETE /v1/sandboxes/{id}`. Internally: select a base image by
`environment_type`, schedule a resource-limited, network-isolated,
read-only-root Pod; `kubectl exec` in to install packages and run the script,
streaming stdout/stderr over the WebSocket; a periodic reaper (or explicit
`DELETE`) destroys the Pod.

**Hybrid local/cloud routing:** the `Code Execution Controller` becomes a
`CeeRouter` deciding per-request whether to run in the cloud CEE or route to a
specific local installation. A lightweight **"Fuse Connector"** app runs on the
user's machine, opening a secure outbound tunnel (WebSocket/gRPC) to a cloud
**Proxy Service** (no inbound firewall ports needed) and listening for jobs; it
has local Docker access to actually run the container. The `CeeRouter` forwards
local-targeted requests to the Proxy Service, which relays them down the tunnel
to the right Connector, which runs the job locally and sends results back up the
same path. This lets agents orchestrate tasks that run in the secure scalable
cloud CEE _or_ reach into a user's local network/files/devices in a controlled,
auditable way.

##### Extension: Serverless functions as managed tools (added to v1.0.0 in follow-up discussion)

Firebase Cloud Functions are treated as pre-deployed, highly reliable tools —
DACC provides the "brains" (orchestration), Firebase the "reflexes"
(event-driven execution). A `FirebaseFunctionCall` schema (`function_name`,
`payload`) is the `OutputModel` for a `FirebaseToolAgent`; a
`FirebaseToolExecutor` controller (using the Firebase Admin SDK) invokes the
named HTTPS Callable function and returns its result to the Orchestrator. Two
chaining modes coexist: **DACC-orchestrated (macro-workflow)** — the
`WorkflowDefinition` has full visibility, e.g.
`Agent -> Firebase Call -> Agent`, with the function's output mappable into the
next agent's input; and **Firebase-internal (micro-workflow)** — a single DACC
step calls one function that internally cascades further functions via Firestore
triggers/Pub-Sub, invisible to the Orchestrator, which just awaits a final
status. The Genesis Agent chooses per task: a simple fire-and-forget business
process uses the latter; a task needing agentic decisions between steps uses the
former.

##### Extension: Real-time streaming via SSE (added to v1.0.0 in follow-up discussion)

Long-running agent work (LLM reasoning, code generation, tool calls) is exposed
to the UI in real time rather than behind a spinner. A `StreamPacket` schema
(`event_type` ∈
`thought | tool_call | tool_output | log_message | token_stream | workflow_update | final_output`,
plus `data` and `step_name`) standardizes every real-time message. Agent `run`
methods become generators that `yield StreamPacket`s as they think, call tools,
and stream tokens, finishing with a `final_output` packet carrying the validated
Pydantic result. Transport: **Server-Sent Events** from the NestJS API Gateway
(an `EventSource`-friendly, simpler-to-proxy alternative to WebSockets for this
one-way flow), backed by **Redis Pub/Sub** as the real-time bus — each workflow
run gets its own channel (`run_logs:{run_id}`); the Orchestrator and workers
_publish_ every `StreamPacket` to it; the NestJS controller holding the open SSE
connection _subscribes_ and forwards each message as an SSE event. The React
frontend uses the native `EventSource` API, adding listeners per `event_type`
(e.g. highlighting the active workflow node on `workflow_update`, appending text
on `token_stream`, rendering the final structured result and closing the
connection on `final_output`) — turning the system from a black box into an
observable, "watch the agents think" experience.

---

## 10. Appendix: Implementation Roadmap (Phase 0 – Phase 4)

_(Original phased roadmap; see the Implementation Status note at the top of this
document — no phase below has been started in this repository.)_

### Phase 0: The Core DACC Runtime (Headless MVP)

**Goal:** A functioning backend engine that can execute a simple, hardcoded DACC
workflow via an API call.

1. **Schema & Infrastructure Setup:** finalize the Prisma schema, run initial
   migrations; scaffold the monorepo (NestJS API, Python services, React
   frontend); deploy RabbitMQ/Redis as the message bus.
2. **Backend Service Scaffolding:** create the initial NestJS app with health
   checks; create the initial Python `Orchestrator` and
   `Agent Execution Controller` apps, wired to the message queue.
3. **Core DACC Implementation (Proof of Concept):** manually insert one or two
   `AgentDefinition`s into `RegisteredEntity`; implement `AgentFactory` using a
   secure, registry-based schema-loading approach (not `exec()`); implement
   headless `Orchestrator` execution of a simple linear (hardcoded) workflow;
   persist the final `run_state` to `WorkflowExecution`.

**Acceptance:** a developer can trigger a workflow via `curl`/Postman; the job
passes through the queue to the Orchestrator and Executor; a `WorkflowExecution`
record is created and correctly updated.

### Phase 1: The Visual Workflow Builder & Real-time UI

**Goal:** Users visually create, save, and run workflows, watching results and
agent "thoughts" stream in real time.

1. **API Development:** full CRUD for `Workflows`/`RegisteredEntities`;
   `POST /workflows/{id}/run-stream` SSE endpoint.
2. **Frontend (React Flow):** main canvas UI; Node Palette from
   `/agents/definitions`; serialize the graph into a `WorkflowDefinition`.
3. **Real-time Streaming Pipeline:** Redis Pub/Sub integration; `StreamPacket`
   implementation with agents yielding packets; NestJS subscribe-and-forward
   over SSE; frontend `EventSource` listeners.

**Acceptance:** a user logs in, builds a workflow visually, saves it, runs it
with inputs, and watches live progress/thoughts in the UI.

### Phase 2: Advanced Tooling & Code Execution

**Goal:** Agents can execute code and interact with managed services like
Firebase.

1. **Custom CEE Service:** design/build the in-house Docker+Kubernetes CEE and
   its API (`/sandboxes/create`, `/execute`, etc.).
2. **`CodeExecutionController`:** a Python client to the CEE service, integrated
   with the Orchestrator's tool-call routing.
3. **Firebase & Custom Tool Integration:** `FirebaseToolExecutor` via the Admin
   SDK; generic tool-call routing framework keyed on `tool_name`.

**Acceptance:** a "Code" node's agent-generated Python runs securely in the CEE
with stdout/stderr/artifacts returned; a "Firebase" node successfully invokes a
specific Cloud Function.

### Phase 3: The Genesis Layer & Autonomous Operation

**Goal:** The system builds itself from natural-language goals.

1. **Genesis Agent Prompt Engineering:** craft/iterate the master
   `AgentDefinition` for the Genesis Agent; use the `instructor` parsing
   strategy for reliability on the complex `SystemBlueprint` output.
2. **`SystemBlueprint` Deployment Logic:** backend service authorized to write
   new `RegisteredEntity`/`Workflow` records from a validated blueprint.
3. **UI for Genesis Agent:** a chat/command interface streaming the Genesis
   Agent's design "thought process."

**Acceptance:** a user types a goal in plain language; the Genesis Agent designs
the needed agents and workflow; they appear in the UI, immediately runnable,
with no manual configuration.

### Phase 4: Enterprise Readiness & Hybrid Cloud

**Goal:** Transform the platform into a secure, scalable, commercially viable
product.

1. **Hybrid Cloud & Local Execution:** build the Fuse Connector (e.g. Electron)
   and the cloud Proxy Service tunneling to it.
2. **Security, Scalability & Multi-Tenancy:** full security audit; strict
   multi-tenancy isolation at the Prisma/API layers; Kubernetes autoscaling for
   CEE/Agent Execution services.
3. **Web3 & Marketplace Features:** `AgentNFT`, `Wallet`, `MarketplaceListing` —
   smart contracts + Web3 library integration.

**Acceptance:** a user installs the Fuse Connector and runs workflows touching
their local filesystem; the platform supports multiple organizations/users with
no data leakage; the system handles high concurrent load; marketplace
foundations are in place.

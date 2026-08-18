`[CLASS:PRIME] [STATUS:PENDING] [DOC_TYPE:TECHNICAL_DOSSIER] [VISIBILITY:COLLECTIVE]`

# Integrating POML, MCP, and A2A into The New Fuse Framework

**Primary Author of Intellectual Property:** Daniel Goldberg

## ⚠️ Implementation Status (added 2026-07-23, do not remove)

Companion document to `DACC_PROTOCOL_MASTER_MANUAL.md` — see that document's
Implementation Status section. **Nothing described here exists as code in this
repository.** This document specifically names **Google's A2A protocol** as "the
standard delegation protocol... the diplomatic language used by the DACC
orchestrator to assign high-level tasks to external, independent agentic
systems" — this is the real, intended answer to "what should TNF's delegation
mechanism be," and it is far more than the small, real, TypeScript-native
`scripts/lib/tnf-agent-match.cjs` capability matcher shipped alongside
`DIRECTIVES.md` D22. That matcher is a first, honest step in this direction
using what the repo actually has today (no Python runtime, no A2A client) — not
an implementation of A2A itself. Building real MCP/A2A client support is future
work requiring its own dedicated plan.

---

## Part 1: DACC vs. POML — A Comparative Analysis

To formulate a robust integration strategy, it is imperative to first conduct a
rigorous comparative analysis of the core architectural philosophies
underpinning The New Fuse's Dynamic Agent Composition and Communication (DACC)
Protocol and Microsoft's Prompt Orchestration Markup Language (POML). This
analysis establishes a shared understanding of both systems' intended domains,
identifies points of natural synergy, and preemptively addresses potential
architectural friction. The strategy frames the integration not as a replacement
of one technology with another, but as a strategic layering of complementary
capabilities, each operating at its optimal level of abstraction.

### 1.1. The DACC Protocol as a Schema-Driven Orchestration Layer

The New Fuse Agentic Framework is built upon the DACC Protocol, a comprehensive
system designed for the definition, instantiation, and communication of agents
and workflows. Its core function is to provide the architectural backbone for a
distributed, multi-agent system — concerned with the _structure, connection, and
execution_ of autonomous components, via a set of rigorously enforced design
principles prioritizing reliability, scalability, and observability.

Primary tenets:

- **Schema-First Design:** all components (agents, workflows, tools) are defined
  by declarative, validated Pydantic schemas — the inviolable contract governing
  component behavior and interaction, ensuring type safety and eliminating
  ambiguity across service boundaries.
- **Declarative Over Imperative:** complex processes/agent interactions are
  described as data (JSON conforming to a Pydantic schema), not coded as
  imperative logic. `WorkflowDefinition` defines the "what"; runtime controllers
  handle the "how" — critical for visual editors and autonomous generation by
  the Genesis Agent.
- **Standardized Communication Bus:** all inter-service communication occurs via
  validated Pydantic objects over a message queue — a reliable, type-safe bus
  ensuring data integrity throughout the system.

DACC is best understood as the "nervous system" of The New Fuse framework: which
agents exist and what are their capabilities (`AgentDefinition`)? how are they
connected into a coherent process (`WorkflowDefinition`)? how is process state
managed and executed by a distributed set of runtime controllers?

### 1.2. POML as a Declarative Instruction and Presentation Layer

Microsoft's Prompt Orchestration Markup Language (POML) addresses a different,
related challenge: the authoring, structuring, and rendering of the prompt
itself — the specific instructions communicated to a single agent's LLM in a
single turn. It solves "prompt spaghetti," where complex prompts become
unstructured, hard to maintain, and brittle, by applying proven web-development
concepts to prompt engineering:

- **HTML-like Structured Markup:** an XML-like syntax with semantic tags
  (`<role>`, `<task>`, `<example>`) organizing a prompt's logical components.
- **Decoupled Presentation Styling:** CSS-inspired `<stylesheet>` blocks or
  inline attributes separate content from presentation/formatting — mitigating
  LLM sensitivity to formatting changes and enabling systematic A/B testing of
  prompt structures.
- **Integrated Templating Engine:** variables (`{{username}}`), loops (`for`),
  conditionals (`if`), `<let>` definitions — dynamic, data-driven prompt
  generation.

POML excels at the "micro" level: the precise content, context, and format of a
single LLM call. Architecturally analogous to the "view layer" in MVC.

### 1.3. Synergies and Divergences

DACC and POML are not competing paradigms; they operate on different, highly
complementary layers of abstraction. **DACC is the orchestrator of agents, POML
is the instructor of a single agent** — "Orchestration vs. Instruction." DACC
answers "which agent runs next, and with what data from previous steps?"; POML
answers "how should this specific agent's task be articulated to the model for
the best possible result?" There is no fundamental architectural conflict — the
integration treats POML as a new language wielded _by_ DACC-defined agents, not
a replacement for DACC's schemas.

| Feature             | DACC                              | POML                                | Role in Integrated System                                                                |
| ------------------- | --------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| Primary Abstraction | Multi-Agent Workflows             | Single-Prompt Content               | System-level orchestration (DACC) delegates to agent-level instruction (POML)            |
| Core Technology     | Pydantic Schemas & JSON           | XML-like Markup                     | DACC schemas define the agent's contract; POML defines the agent's prompt                |
| Scope of Control    | Inter-Agent Communication & State | Intra-Prompt Structure & Formatting | DACC manages data flow between agents; POML manages presentation to the LLM              |
| Key Artifact        | `WorkflowDefinition.json`         | `template.poml`                     | The `WorkflowDefinition` orchestrates steps, each of which may use a `.poml` file        |
| Validation          | Strict, Type-Safe Pydantic Models | LLM-facing Schema Hints             | DACC provides hard output validation; POML provides soft hints to improve output quality |

---

## Part 2: Embedding POML into the `AgentDefinition` Schema

### 2.1. Revising `AgentDefinition` for POML-Native Prompts (v2.0)

The current schema uses separate string fields (`persona`, `output_schema_code`,
`parsing_grammar`) to construct a prompt. POML allows a holistic, structured
definition of an agent's persona, task, examples, and output format in one
coherent document (`<role>`, `<task>`, `<output-format>`, `<example>`). Proposed
`AgentDefinition v2.0`:

- **ADD** `poml_template: str` — the complete POML markup; single source of
  truth for the agent's instructions.
- **DEPRECATE** `persona: str` — superseded by `<role>`/`<task>` tags.
- **DEPRECATE** `parsing_grammar: str` — POML's structure plus explicit
  output-format instructions and few-shot examples reduce the need for a
  separate Lark grammar; validation shifts to the Pydantic schema itself.
- **RETAIN** `output_schema_code: str` — remains critical to DACC's reliability
  guarantee; its relationship to POML's `<output-schema>` tag is addressed by
  the "Hint-then-Validate" pattern (Part 3).

### 2.2. Modifying the Agent Execution Controller for POML Rendering

Requires the official POML Python SDK (`pip install poml`). Execution flow: the
controller receives a job (target `AgentDefinition` v2.0 + current workflow
state/inputs from prior steps), extracts `poml_template`, prepares a context
dictionary from the workflow state, invokes the SDK's `poml()` rendering
function with the template + context, and sends the resulting rendered prompt
(plain text, or a structured chat-message list) to the LLM API.

### 2.3. Bridging `input_mapping` to POML Context Variables

DACC's `WorkflowStep.input_mapping` declaratively wires prior-step outputs into
the current step's inputs; POML's templating engine consumes exactly this kind
of context dictionary via `{{variable}}` syntax. The Orchestrator bridges the
two: it evaluates `input_mapping` against `run_state` to produce a context dict,
includes it in the job payload, and the Agent Execution Controller passes that
same dict as `context` to the POML renderer — seamless, declarative data flow
from workflow to prompt with no imperative glue code.

### 2.4. Worked Example

```json
{
  "workflow_name": "Personalized Greeting Workflow",
  "start_step": "ProfileUser",
  "steps": [
    {
      "step_name": "ProfileUser",
      "agent_name": "user_profiler_agent",
      "default_next_step": "GenerateGreeting"
    },
    {
      "step_name": "GenerateGreeting",
      "agent_name": "greeting_agent_v2",
      "input_mapping": { "user_name_input": "state.ProfileUser.output.name" }
    }
  ]
}
```

```python
AgentDefinition(
    agent_name="greeting_agent_v2",
    description="Generates a personalized greeting.",
    poml_template="""
<poml>
    <role>You are a friendly and enthusiastic greeter.</role>
    <task>Write a short, welcoming greeting to {{user_name_input}}.</task>
</poml>
    """,
    output_schema_code="class GreetingOutput(BaseModel): greeting: str"
)
```

If `ProfileUser` outputs `{'name': 'Daniel'}`, the Orchestrator resolves
`input_mapping` to `{'user_name_input': 'Daniel'}`, and:

```python
from poml import poml
context = {'user_name_input': 'Daniel'}
final_messages = poml(poml_template, context=context, chat=True)
# -> System: You are a friendly and enthusiastic greeter.
#    User: Write a short, welcoming greeting to Daniel.
```

---

## Part 3: Advanced POML Features

### 3.1. Data Components (`<document>`, `<table>`, `<img>`) and the "DACC Data Resolver"

POML's data components let prompts embed/reference rich external sources (files,
spreadsheets, images, directories) — transformative for
document-analysis/summarization/multimodal agents. But DACC has no native
mechanism to resolve a `src` URI (`<document src="file://local/report.docx">`);
burdening the stateless Agent Execution Controller with file access, DB
connections, and credential management would violate separation of concerns and
introduce security risk.

**Proposed: a "DACC Data Resolver"** (standalone microservice or Orchestrator
library) that pre-processes POML templates and resolves all data-component
references _before_ dispatch: after `input_mapping` resolution but before
sending the job, the Orchestrator passes the template to the Resolver; it scans
for data-component tags, parses each `src` URI's scheme (`file://`, `https://`,
`db://`, `cee://`, ...), dispatches to the corresponding existing service (e.g.
`cee://job-123/artifacts/output.csv` → the Code Execution Environment;
`db://sales_db/quarterly_report` → a sandboxed-query data service; `https://...`
→ a secure HTTP fetch), and injects the resolved content back into the template
(e.g. rewriting `<document src="...">` into a
`<let name="doc_content_1">...</let>` variable). The fully-hydrated template
then goes to the Agent Execution Controller, which renders using only workflow
context variables — no knowledge of external data sources required. This keeps
the Controller simple/secure/scalable while the Resolver encapsulates the
sensitive data-fetching logic, independently securable and scalable.

### 3.2. Metadata Tags and the "Hint-then-Validate" Pattern

POML's `<stylesheet>`, `<output-schema>`, and `<tool-definition>` tags don't
appear in the rendered prompt but instruct the renderer/LLM. `<output-schema>`
and `<tool-definition>` risk duplicating DACC's strict Pydantic
`output_schema_code`/`ToolRequest` contracts using the less expressive JSON
Schema format — simply replacing DACC's Pydantic contracts with POML's hints
would be a reliability downgrade and violate "Schema-First."

**Resolution — the "Hint-then-Validate" pattern:**

1. **Hint:** during rendering, the Agent Execution Controller processes
   `<output-schema>`/`<tool-definition>` and passes that metadata to the LLM API
   in its native format (e.g. OpenAI's `tools`/`functions` parameter) — a strong
   in-context guide that raises first-try correctness.
2. **Validate:** the LLM's response is still run through DACC's existing
   validation pipeline against the authoritative Pydantic `output_schema_code`
   (or the relevant `ToolRequest` schema). Anything failing strict validation
   goes through DACC's existing error-handling/ retry logic.

POML's metadata increases the odds of a well-formed first response; DACC's
Pydantic validation remains the uncompromised guarantee of data integrity.

---

## Part 4: The Genesis Layer, Reimagined for POML

### 4.1. From Schema Architect to POML Author

Today the Genesis Agent generates several disparate artifacts per new agent (a
natural-language `persona`, a formal Lark `parsing_grammar`, Pydantic
`output_schema_code`) — keeping them logically consistent is a demanding
prompt-engineering challenge. With POML, its mandate becomes: author a single,
rich `poml_template` per agent, using `<role>`, `<task>`, `<example>`,
`<output-format>` to holistically encapsulate persona, task, few-shot guidance,
and output hints; `output_schema_code` remains separately generated to preserve
DACC's validation guarantee.

### 4.2. `SystemBlueprint` — No Structural Change Needed

`SystemBlueprint` (a container for `AgentDefinition`s + a `WorkflowDefinition`)
needs no structural change — only the _content_ of the `AgentDefinition`s it
carries changes, from multi-format strings to a single `poml_template`.

### 4.3. Why This Simplifies Autonomous Generation

Unifying persona + parsing grammar + output hints into one coherent POML
document lowers the Genesis Agent's cognitive load — it works with a single
specification language for prompt design instead of juggling natural language, a
formal grammar, and Python code simultaneously — freeing it to focus reasoning
on higher-level architectural decisions (which agents to create, how to connect
them). Expected outcome: more consistent, robust, higher-quality
autonomously-created systems.

---

## Part 5: Revised, POML-Integrated Implementation Roadmap

_(Overlay on top of `DACC_PROTOCOL_MASTER_MANUAL.md`'s Phase 0–4 roadmap — same
caveat: nothing here has been started.)_

| Phase                                              | Original Goal                                              | POML-Specific Tasks                                                                                                                                                                                                                                           | Acceptance Criteria                                                                                                                                                                           |
| -------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase 0** — Core DACC Runtime                    | Functioning backend executing a hardcoded workflow via API | Add `poml` as a core Python dependency; implement `AgentDefinition` v2.0 with `poml_template`; modify the Agent Execution Controller to use `poml.poml()` for rendering with job-payload context; manually insert one POML-based agent for end-to-end testing | A workflow triggered via API executes an agent whose final prompt was rendered from a DB-stored POML template; `WorkflowExecution` updates correctly                                          |
| **Phase 1** — Visual Builder & Real-time UI        | Visual workflow creation with real-time streaming          | Integrate a code editor (e.g. Monaco) into the node config panel for `poml_template`, with POML syntax highlighting; update frontend API/data models for `AgentDefinition` v2.0; ensure the Node Palette reflects v2.0 definitions                            | A user writes/edits a multi-line POML prompt in the visual editor, saves, and runs the workflow successfully with real-time streaming intact                                                  |
| **Phase 2** — Advanced Tooling & Code Execution    | Agents can execute code / call managed services            | Build the "DACC Data Resolver"; implement `cee://`/`db://` URI handlers routing into existing Tool Execution Controllers/data sources; implement "Hint-then-Validate" for `<tool-definition>`/`<output-schema>`, keeping Pydantic authoritative               | An agent's `<document src="cee://job-123/output.txt">` is resolved and injected by the Resolver and processed; POML-hinted tool calls validate correctly against DACC's Pydantic tool schemas |
| **Phase 3** — Genesis Layer & Autonomous Operation | System designs itself from natural language                | Re-engineer the Genesis Agent's master prompt to output `SystemBlueprint`s whose `AgentDefinition`s carry high-quality `poml_template`s; update deployment logic for v2.0 persistence                                                                         | A high-level goal produces a fully deployed, POML-native multi-agent system immediately runnable in the UI                                                                                    |
| **Phase 4** — Enterprise Readiness                 | Secure, scalable, commercial-grade platform                | No new core POML tasks; document how POML's modularity (Git-versionable, reusable, auditable templates) serves enterprise governance/maintainability                                                                                                          | All original Phase 4 criteria met, with POML template structure identified as a maintenance-overhead reducer                                                                                  |

---

## Part 6: Layering In Anthropic's MCP and Google's A2A

Integrating established protocols like Google's A2A and Anthropic's MCP is
sound: neither conflicts with the DACC+POML architecture above; both layer in as
complementary standards, each serving a distinct purpose.

### 6.1. MCP — The Standardized "Agent-to-Tool" Bridge

MCP solves the "N×M" integration problem: standardizing how one agent connects
to external tools/data sources (a universal "USB-C port" for AI, any compliant
agent to any compliant tool with no custom connectors). This aligns directly
with DACC's existing decoupling of intent from execution via specialized Tool
Execution Controllers (CEE, Firebase, etc.) — MCP enhances and standardizes that
pattern rather than replacing it.

**Proposed integration:**

- **Generic `MCP_Tool_Executor`:** one reusable universal MCP client, instead of
  a bespoke Tool Execution Controller per future integration (Salesforce,
  GitHub, etc.).
- **Route via the Orchestrator:** when a POML-instructed agent emits a validated
  tool-call Pydantic object for an MCP-compliant tool, the Orchestrator routes
  the job to `MCP_Tool_Executor`.
- **Standardized execution:** the executor discovers the target MCP server's
  functions, sends the `tools/call` request, and returns the formatted result
  into the workflow.

MCP becomes the standard protocol for TNF's "Advanced Tooling & Execution
Environments" layer, giving DACC-native agents access to a growing open
ecosystem of pre-built tools with drastically less integration overhead.

### 6.2. A2A — The Secure "Agent-to-Agent" Fabric (Delegation)

Google's A2A protocol addresses a different challenge: enabling distinct,
_opaque_ AI agents — potentially built by different vendors, running in separate
infrastructure — to communicate and collaborate. Where MCP is "vertical"
(agent-to-tool), **A2A is "horizontal" (agent-to-agent)**.

This is not a replacement for DACC's internal orchestration — it's a new type of
workflow step letting a DACC-native system **delegate tasks to external,
third-party agents**.

**Proposed integration:**

- **`A2A_Execution_Controller`:** acts as an A2A client managing communication
  with external agents.
- **"A2A Proxy" workflow node:** in the visual builder, a node type configured
  with the target external A2A-compliant agent's endpoint URL.
- **Task-based execution:** when a workflow reaches this step, the Orchestrator
  dispatches to `A2A_Execution_Controller`, which performs discovery (fetches
  the external agent's "Agent Card" to learn its capabilities), initiates a
  task-based interaction (JSON-RPC over HTTP), and manages the task lifecycle
  (`submitted` → `working` → `completed`, including long-running tasks via
  streaming/push notifications). The external agent's final "artifact" becomes
  this step's output, mappable into the next DACC-native agent.

This lets TNF securely interoperate with a broader ecosystem of specialized
agents, treated as trusted, fire-and-forget collaborators, without exposing
internal logic.

### 6.3. The Unified Multi-Protocol Architecture

Each protocol operates at its optimal layer of abstraction:

- **DACC** — the core internal "nervous system": schema-first orchestration for
  all native agents/workflows.
- **POML** — the universal instruction language DACC agents use to structure
  reasoning and articulate needs to the underlying LLM.
- **MCP** — the standard tool-use protocol: what Tool Execution Controllers
  speak to give agents access to data/APIs.
- **A2A** — **the standard delegation protocol**: the diplomatic language the
  DACC orchestrator uses to assign high-level tasks to external, independent
  agentic systems.

This is internally robust (DACC), expressively powerful (POML), highly
extensible with tools (MCP), and openly collaborative with the wider AI
ecosystem (A2A).

---

## Summary of Core Recommendations

1. **Adopt a Dual-Standard Architecture:** POML as the standard for agent
   instruction; DACC unequivocally retained as the standard for system
   orchestration. All future agent development should be POML-native.
2. **Revise `AgentDefinition` to v2.0** — POML-centric, consolidating prompt
   logic into `poml_template`, deprecating `persona`/ `parsing_grammar`.
3. **Implement "Hint-then-Validate"** for POML metadata vs. DACC's Pydantic
   contracts — hints improve LLM output quality; Pydantic remains the sole
   authoritative validator.
4. **Build a "DACC Data Resolver"** to securely resolve POML data-component URIs
   before agent execution.
5. **Upgrade the Genesis Agent** into a native author of high-quality,
   structured POML templates.
6. **Layer in MCP** as the standard tool-use protocol via a generic
   `MCP_Tool_Executor`.
7. **Layer in A2A** as the standard delegation protocol via an
   `A2A_Execution_Controller` and "A2A Proxy" workflow node.

## Anticipated Benefits

- **Enhanced Modularity & Maintainability:** prompts become
  version-controllable, reusable, easily editable artifacts instead of
  unstructured text blobs.
- **Increased Agent Power & Flexibility:** native support for rich/ multimodal
  content via POML's data components broadens the range of tasks agents can
  tackle.
- **Improved Developer Experience:** POML's tooling ecosystem (VS Code
  extension: syntax highlighting, auto-completion, live previews) accelerates
  development/testing/debugging.
- **More Reliable Autonomous Generation:** a single, coherent output format for
  agent instruction simplifies the Genesis Agent's task, improving consistency
  and quality of autonomously-created systems.

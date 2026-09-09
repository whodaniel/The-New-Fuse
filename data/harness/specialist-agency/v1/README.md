# TNF specialist engineering agency, revision 1

Status: profiles and interface contracts initialized. Runtime activation is
pending adapter integration and acceptance checks. No production worker is
started by this bundle.

Six agent_manifest.json files define the requested engineering roles. Each has a
dedicated operational prompt and closed Draft-07 input/output schemas.
orchestrator_prompt.md preserves the supplied meta-prompt text with normalized
whitespace. This bundle is configuration for existing TNF orchestration, not
another scheduler or provider registry. Existing .agent/fleet/agency/agents
contains business agency personas; these engineering profiles serve a different
responsibility.

Run `node data/harness/specialist-agency/v1/verify.cjs` from the repository
root. The verifier checks pinned bytes, schema compilation and rejection of
invalid/cross-role handoffs. integrity.json is an immutable revision digest
catalog: consumers must pin its SHA-256 from a trusted release, verify it before
loading, and use a new revision for changes. A digest beside mutable files alone
is not a security boundary. This verifier does not dispatch tools or enforce
host permissions.

## Activation contract

The Principal Orchestrator must verify the trusted revision digest, discover
current providers by capabilities and acquire scoped work ownership. Compile
schemas with coercion and removal of extra fields disabled. Validate messages
before dispatch and results before propagation; reject mismatched task IDs,
stale deadlines, unauthorized reference locations, digest mismatches, and
verified claims without independently checked evidence. These semantic checks
require the runtime adapter; schema validity alone is insufficient.

Use existing Coordinator.submitTask with role capabilities, task ID correlation,
deadline, dependency IDs and bounded retries. Keep six role identities even when
fewer workers are available; queue roles rather than combine security with
context ownership. Require worker acknowledgement, heartbeat, cancellation and
completion receipts. Halt on missing capabilities or enforcement adapters. Do
not silently downgrade required isolation.

Start with runtime and MCP contract design; security independently validates
dispatch and signed approval boundaries. Context and memory may then implement
against accepted reference/checkpoint contracts in separate scopes. Evaluation
checks every delivery, including security denial and crash recovery, before
promotion. Cap retries globally as well as per specialist; escalation must
terminate at the Principal Orchestrator, not cycle through fallback roles.
Unknown external outcomes require reconciliation, not replay.

Runtime acceptance requires actual process-kill journal recovery, expired
reference and quota behavior, real MCP transport in the chosen sandbox,
rejected/replayed/modified approval grants, SQLite restart and tenant isolation,
and deterministic loop termination. No provider, sandbox, SQLite migration, or
production readiness is claimed by configuration initialization.

## Existing implementation candidates

- Runtime: packages/tnf-cli/src/commands/agents-run.ts and
  services/SessionManagerService.ts; session JSON is not proof of an append-only
  recovery journal.
- Context: packages/tnf-cli/src/services/MemoryCompactorEngine.ts and
  packages/agent-coordination/src/context/ContextBranchManager.ts. Do not invoke
  transcript pruning to initialize profiles.
- MCP: packages/tnf-cli/src/services/MCPToolRuntimeService.ts and
  packages/coding-agent-delegation/src/mcp-server.ts. Transport availability
  does not prove sandbox isolation.
- Security: signed delegated authority in agents-run.ts and
  packages/tnf-cli/src/orchestration/ProtocolInterceptor.ts. Independently
  verify enforcement behavior.
- Memory: packages/tnf-cli/src/services/MemoryService.ts and
  MemoryProviderService.ts. Reconcile storage governance before adding SQLite;
  do not write host-owned assistant memories.
- Evaluation: packages/agent-coordination/src/coordination/RecoveryManager.ts
  and packages/core-error-handling/src/base/BaseErrorHandler.ts. Do not use
  placeholder evaluator checks as production acceptance evidence.

Classification: core / oss_runtime / product_state / public. Existing
durable-task changes remain separately owned. User-supplied external article
links are background provenance, not independently verified implementation
evidence.

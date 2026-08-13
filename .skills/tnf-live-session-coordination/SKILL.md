---
name: tnf-live-session-coordination
description: "Use when coordinating multiple live TNF/Codex sessions, polling active terminal windows, checking whether another agent is already working an edge, establishing lane splits, or handling A2A coordination incidents. Prefer shared thread context and repo artifacts over raw TTY writes; treat terminal injection as an emergency fallback only."
---

# TNF Live Session Coordination

Use this skill when live agent coordination is happening across multiple local
Terminal/Codex sessions and you need to inspect, classify, and coordinate those
sessions without corrupting their interactive state.

This is a transitional skill. It exists because current coordination can still
depend on prompt-maintained attention. TNF protocol is meant to replace that
with durable liveness, signaling, handoff, and recovery.

## When To Use

Trigger this skill when the user asks to:

1. poll running terminal windows or tabs,
2. determine whether another agent already owns a task edge,
3. coordinate with another live Codex session,
4. inspect terminal content for unfinished work,
5. recover from prompt contamination caused by terminal-level coordination,
6. document or classify A2A/TTY incident findings.

## Coordination Hierarchy

Use channels in this order:

1. shared conversation/thread context,
2. durable repo artifacts such as docs, commits, and lane-split notes,
3. read-only terminal/session inspection,
4. human-confirmed local interaction,
5. raw TTY/device writes only as an emergency fallback.

Important:

1. Do not treat raw terminal injection as a normal A2A transport.
2. Keep fallback knowledge, but do not let fallback behavior become the core
   architecture.
3. TNF should move from prompt-maintained orchestration to protocol-maintained
   continuity.

## Success-First Rule

Operational success has higher authority than speculative diagnosis.

Do not disable, reroute, or replace a live coordination path when the path is
currently succeeding on the exact target under test.

Treat the path as successful when the current target shows all of the
following:

1. the intended target identity is deterministic,
2. the target emits the expected acknowledgment or status signal,
3. the target tab is not left in queue-composer state,
4. the wake text is not stranded unsent in that exact target tab.

Only classify the path as failed when there is direct target-specific evidence:

1. no acknowledgment from that exact target, and
2. unsent or contaminated prompt state still present in that exact target tab,
   or
3. the resident service itself is down or crashing.

Do not escalate from a local target-specific failure into a global service
shutdown unless multiple targets are failing in the same way or the resident
service is unhealthy.

## Evidence-First Prompt Correction

Prompt text, stale lane notes, and self-description do not outrank live
observed work or live observed success.

If current metadata plus read-only evidence contradict a session's claimed
lane:

1. correct the lane classification immediately in the durable artifact,
2. treat the corrected durable artifact as authoritative for the current run,
3. do not preserve an inaccurate prompt narrative just because it already
   exists.

## Immediate Proliferation Rule

When a new working revelation is discovered during a coordination run:

1. propagate it into the current durable lane artifact immediately,
2. update the governing protocol or skill when the revelation changes future
   coordination behavior,
3. do not leave the correction local to one tab, one operator, or one prompt.

## Workflow

### 1. Inventory Sessions Safely

Start with app/window metadata and process state before reading visible buffer.

Preferred techniques:

1. Terminal window/tab count and selected-tab metadata via AppleScript,
2. `busy`, `tty`, and process inventory,
3. `ps` for Codex/native binary/MCP processes,
4. `lsof -p <shell-pid> -d cwd` for working directory,
5. visible-buffer polling only after you know which session you are reading.

Prefer metadata-first inspection over content-first inspection.

## 2. Classify Session Ownership

For each active session, determine:

1. what task edge it is working,
2. whether it is active or idle,
3. whether it overlaps with your current lane,
4. whether it needs continuation, coordination, or no action.

If another session already owns the same edge, establish a lane split rather
than racing it.

If the session is newly discovered and not yet known to TNF, create a
provisional discovery record instead of leaving it anonymous.

### Conflict Test

Treat a conflict as present when any of the following are true:

1. two sessions overlap on the same task edge by purpose, not just by file,
2. two sessions are simultaneously doing coordination, fingerprint enrichment,
   conflict detection, or lane-split generation,
3. a session drifts from prior authoritative ownership into an already-owned
   production-risk surface,
4. a session touches relay-monitor runtime, local Sub-Director wake path, docs
   resident-loop continuity, or API Director pending-work while that surface is
   already owned elsewhere,
5. prompt contamination makes safe ownership inference impossible.

Prompt contamination alone is not enough to disable a successful resident
service. It must be tied to direct target-specific delivery failure.

### Ownership Precedence

Treat prior ownership as the default authority:

1. keep the previously declared lane unless an explicit override is issued,
2. ignore generic idle prompts as ownership signals,
3. require deterministic target identity (`tty` and/or `window id`) for any
   reassignment.
4. do not treat lane ownership as immunity from scheduler-driven heartbeat or
   stall-defense; those operate on observed non-advancement.

Authoritative override checklist:

1. explicit override instruction exists,
2. target session identity is named,
3. new lane scope and forbidden surfaces are defined,
4. override is written to a durable artifact before execution,
5. target session acknowledges in-band.

## 3. Coordinate Through Durable Artifacts

Preferred coordination outputs:

1. a concise shared-thread summary,
2. a repo note documenting lane ownership or protocol findings,
3. commit references to the authoritative artifact,
4. explicit touched-file boundaries when two sessions are close to colliding.

If a coordination conclusion matters later, write it somewhere durable.

Required durable output for each live coordination run:

1. timestamp, host, and operator identity,
2. metadata-first fingerprint for each live session,
3. explicit conflict test used in the run,
4. authoritative lane classification for each session,
5. conflicts detected or an explicit no-conflict statement,
6. holds, overrides, quarantine decisions, and handoffs.

## 3.1 Session Fingerprint Contract

When you need to clearly distinguish one live terminal or agent session from
others, ask for a session fingerprint.

Minimum fields:

1. `tnf_agent_id` if already known, otherwise a provisional marker,
2. `tty`,
3. `shell_pid`,
4. `pwd`,
5. `foreground_process`,
6. `hostname`,
7. `username`,
8. `timestamp`,
9. `session_marker`.

Preferred operator flow:

1. ask the session to report its fingerprint explicitly,
2. store the result as a durable note or registry artifact,
3. use the fingerprint to avoid cross-session prompt contamination.

## 3.2 Discovery Tagging And Enrichment

When a newly discovered session appears agent-like or coordination-relevant:

1. assign a provisional `tnf_agent_id` immediately,
2. apply baseline tags for runtime, transport, trust scope, role, and
   `status:discovered`,
3. enrich the record during onboarding with capabilities, tools, ownership, and
   lifecycle state,
4. mirror the record into the wider TNF registry path when durable sync is
   available.

## 4. Terminal Interaction Rules

### Safe Enough

1. window metadata inspection,
2. process inventory,
3. tty-to-window mapping,
4. read-only visible-buffer polling,
5. repo-doc coordination.

### Unsafe By Default

Do not assume these are safe on a live Codex tab:

1. direct `printf` writes to `/dev/ttys00*`,
2. `do script` style automation against the live tab,
3. using newline as proof that a message was accepted,
4. raw control-character recovery writes such as `\\r` or `\\003`,
5. terminal probes that may inject text into the active prompt.

### Emergency Fallback Only

Raw TTY or direct UI injection knowledge is still important as operator
fallback knowledge. Use it only when:

1. the user explicitly wants terminal-level intervention,
2. shared-thread and repo-artifact coordination are insufficient,
3. you accept that the target session may be in non-canonical/raw mode,
4. you verify the exact target session before acting,
5. you confirm post-action state instead of assuming success.

If a live prompt looks frozen after coordination attempts, treat it as a dirty
prompt until proven otherwise.

If emergency fallback succeeds for the exact target, record that as success and
do not declare the broader transport failed without additional direct evidence.

## 5. Dirty Prompt Recovery

If a live Codex session appears frozen after terminal-level coordination:

1. check whether the process is still alive,
2. check whether the tab is still busy,
3. inspect TTY mode before assuming a crash,
4. avoid further blind writes,
5. prefer human-local input to clear the prompt,
6. preserve the session rather than forcing recovery through more injection.

Dirty prompt recovery is target-local by default:

1. clear the exact contaminated target first,
2. keep the resident service running if other targets are still succeeding,
3. do not global-stop the coordination path unless the service itself is the
   verified source of repeated target failures.

## 6. Protocol Design Implication

Capture the architectural lesson when relevant:

1. local ad hoc orchestration is useful,
2. but it is not durable continuity,
3. Master Clock, heartbeat, handoff, and stall-defense should externalize
   wakefulness into protocol machinery,
4. fallback terminal methods belong in operator playbooks, not as the default
   TNF transport.

The Local Director should be treated as continuously live while TNF is active.
Discovery polling is part of that default continuity loop.

When sequential skills, scheduling, and live-session coordination need to stay
connected, define or consult the skill-sequence orchestration fiber bridge
rather than relying on implicit handoffs.

If `orchestrator-agent` is invoked as part of that flow, treat it as a temporal
actor invocation that should emit a presence/beacon event into the local
Sub-Director continuity path and then into the wider TNF actor-recognition
path.

That invocation should also register the coordinating actor into:

1. local heartbeat coverage,
2. conversation stall-defense monitoring,
3. lease-based downgrade/removal on `HANDOFF`, `COMPLETE`, `ABANDON`, or lease
   expiry.

## 7. Orchestrator Presence Semantics

When `orchestrator-agent` is invoked, the most logical beacon flow is:

1. local Sub-Director presence ledger,
2. TNF Central actor registry or shared-state presence channel,
3. durable local audit log for replay or reconciliation.

This ordering preserves local continuity even when the network is unavailable.

Invocation is not fully complete until the local coordinating actor is enrolled
into heartbeat and conversation stall-defense for the duration of its
coordination lease.

Minimum beacon semantics:

1. `ACTOR.INVOKE`
2. `ACTOR.HEARTBEAT`
3. `ACTOR.HANDOFF`
4. `ACTOR.STALL`
5. `ACTOR.COMPLETE`
6. `ACTOR.ABANDON`

Recommended fields:

1. `actor_id`
2. `actor_role`
3. `session_id`
4. `invocation_id`
5. `node_id`
6. `tenant_id` when scoped
7. `workstream_id` or `correlation_id`
8. `started_at`
9. `heartbeat_due_at`
10. `parent_actor_id` when delegated
11. `capability_profile`
12. `trust_state`

### Orchestrator Invocation Limit

Invoke `orchestrator-agent` only when one of the following is true:

1. two sessions touch the same edge,
2. a handoff is needed,
3. protocol understanding differs,
4. a production-risk surface is involved,
5. lane ownership cannot be inferred safely from metadata plus read-only
   polling.

If none of these are true, keep the resolution local and do not escalate.

Do not invoke `orchestrator-agent` merely because a successful live path feels
suspicious. Invoke it only when the conflict or failure criteria above are met
with evidence.

## 8. Orchestrator Classification

Treat the current `orchestrator-agent` as a `Proto Director Orchestrator`, not
as a pure orchestrator.

Why:

1. it does more than sequence and assign work,
2. it performs task decomposition, delegation, state transition management, and
   failure recovery,
3. it reasons about cross-session coordination and lane ownership,
4. it is still not the final authority for entitlement, network governance, or
   Master Clock issuance.

So the classification is:

1. not a pure orchestrator,
2. not yet the Master Director,
3. currently a Proto Director Orchestrator.

## References

Read [tty-a2a-findings.md](./references/tty-a2a-findings.md) when:

1. a live Codex tab appears frozen after coordination,
2. you need artifact classes or incident-processing language,
3. you need the exact operational rule for why raw TTY injection is unsafe.

Read [skill-sequence-fiber.md](./references/skill-sequence-fiber.md) when:

1. you need to formalize the connection between sequential skills,
2. a workflow needs explicit execution order and schedule binding,
3. a live-session handoff must stay aligned with orchestrator scheduling.

Read [orchestrator-presence.md](./references/orchestrator-presence.md) when:

1. orchestrator invocation should become a network-recognized actor event,
2. you need beacon destinations or lease semantics,
3. you need the Proto Director Orchestrator framing.

Read [terminal-coordination-prompt-block.md](./references/terminal-coordination-prompt-block.md) when:

1. another terminal-based agent needs an explicit polling/coordination prompt,
2. you want a copy-paste TNF operator block for conflict detection,
3. orchestrator escalation criteria need to be stated explicitly.

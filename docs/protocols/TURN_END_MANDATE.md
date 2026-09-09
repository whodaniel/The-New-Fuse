`[CLASS:PRIME] [STATUS:LOCKED] [DOC_TYPE:PROTOCOL_STANDARD] [VISIBILITY:COLLECTIVE]`

# TNF Turn End Mandate — V2

**Status:** ACTIVE  
**Protocol ID:** `TNF_TURN_END_CANONICAL`

## Purpose

Turn End writes a compact, machine-readable receipt of what changed, what
context it belongs to, which capabilities were involved, what remains uncertain,
and how the next session should resume.

Turn End complements Turn Zero V2. Turn Zero establishes safe action context;
Turn End preserves enough verified context to avoid rediscovery without turning
private session material into global product state.

## Preferred command

```bash
node scripts/turn-end-v2.cjs
```

`turn-end-v2.cjs` retains the useful legacy handoff capture from
`scripts/turn-end.cjs`, upgrades it to the V2 schema, and stages the canonical
handoff files unless `--no-stage` is used. The canonical emitter of the
`SESSION_HANDOFF_LATEST.{json,md}` artifacts themselves is
`pnpm run handoff:emit:verified`
(`scripts/protocols/emit-session-handoff.cjs --auto-verify`);
`scripts/turn-end.cjs` and `turn-end-v2.cjs` retain their legacy capture paths
but are not the canonical emitter.

## Handoff specification

Current spec:

```text
tnf/session-handoff/0.2
```

Schema:

`docs/protocols/schemas/tnf-session-handoff.schema.json`

## Required V2 context

### Repository context

Record:

- canonical repository: `whodaniel/tnf-monorepo`
- branch
- HEAD SHA
- active origin if available
- whether the working tree was dirty
- downstream publication targets

Do not write `"The-New-Fuse"` as the development repository.

### Classification

Record the three Turn Zero axes:

- work domain
- artifact destination
- data residency
- sensitivity

Unknown classification must be explicit; do not silently default private
material to public.

### Capabilities

Record:

- capabilities required
- providers/harnesses that staffed them, when known

The handoff is capability-first. Provider names are implementation receipts, not
protocol identities.

### Publication impact

Record whether the work is expected to affect:

- public open runtime
- private control plane
- satellites

This is not authorization to publish; it is a routing receipt.

### Freshness

Carry a compact summary of current state-freshness receipts. Do not copy
volatile conclusions without observation timestamps/state.

### Verification

Preserve the verification results appropriate to the work. `na` is preferable to
inventing a pass.

## Reflection, gaps, and the turn's own audit

Every turn runs `scripts/protocols/turn-end-reflection.cjs` and records its
answers in the handoff's `reflection` field. Three questions, none of which the
tooling may answer on the author's behalf:

1. **Lessons** — did this session learn something a future session would
   otherwise rediscover the hard way? (`--lesson <slug>`)
2. **Skills** — did it actualize a reusable capability the library does not
   already have? Check overlap before adding one. (`--skill <slug>`)
3. **Gaps** — what was found and deliberately *not* closed? A gap left
   unrecorded is rediscovered rather than inherited. (`--gap "<text>"`)

Answering "nothing this turn" is legitimate, but it must be asserted with a
reason (`--no-lessons`, `--no-skills`, `--no-gaps`), not inferred from silence.
With no flags the handoff records `considered: false` and the self-audit reports
it. Consistent with the Verification rule above: `na` is preferable to inventing
a pass, and an auto-written lesson is a confident guess about what mattered.

This is Axiom 8 (D3, Non-Temporal Proliferation) applied to the turn itself — an
improvement that never reaches the shared framework is void — and Axiom 5
(Persistence): fruitful understandings are not left as transactional transients.

### The turn audits itself

Turn End decides what the next session inherits, so a defect here is invisible
exactly when it matters most. Each turn records `reflection.self_audit`:

| check | catches |
|---|---|
| `work-summary-present` | a turn that recorded no work |
| `work-summary-not-stale` | the previous handoff's summary carried forward as this one's |
| `classification-complete` | a handoff missing any of the four classification fields |
| `reflection-answered` | Q1/Q2 never asked |
| `gaps-considered` | no gap analysis for the session |
| `next-actions-not-all-inherited` | a turn that added no next action of its own |
| `changed-paths-recorded` | a dirty tree recorded as no changed paths |

These report, they do not block: a Turn End that refuses to record the turn
loses more than it protects. The findings live in the handoff so the next
session sees what this one got wrong.

Two of these come from an observed failure rather than theory. On 2026-09-06
`turn-end-v2.cjs --help` printed usage and then emitted a real handoff; with no
`--summary` it carried the previous session's `work_summary` forward as if it
were that session's work, and staged all three protocol files. `--help` is now
inert, and the stale-summary and inherited-next-action checks catch the shape.

## Privacy-preserving propagation

### Universalize the pattern, not the private context.

Turn End must not transform a private personal/client/tenant session into a
public/global artifact simply because the session produced useful learning.

When a reusable pattern was found:

1. preserve the private source in its proper external/private location;
2. create a sanitized generalized artifact only when useful;
3. classify that generalized artifact separately;
4. reference the generalized result in the handoff.

## Session completion

A substantial session should leave:

- canonical JSON handoff;
- human-readable Markdown mirror;
- next actions;
- classification;
- repository/capability/freshness receipts;
- verified changed paths/artifacts as available.

A session need not mutate `LIVING_STATE.md` merely to prove that it existed.
Global state is for durable framework state, not a chronological dumping ground.

## Checkpointing

Turn End may be run more than once during a long session. The latest handoff
supersedes the prior latest handoff while git history and external receipts
retain chronology.

Run Turn End:

- after significant implementation;
- before a long interruption;
- before a major context switch when continuity would otherwise be lost;
- at session close when there is meaningful state to hand forward.

Tiny conversational sessions with no changed implementation/context do not
require ritual churn.

## Publication rule

Turn End never directs feature commits into downstream publication repos.

Development remains in:

`whodaniel/tnf-monorepo`

Publication follows `docs/REPO_SEPARATION.md` and the sync workflow.

## Governance

Turn Zero and Turn End form a paired lifecycle contract. Both are protected by
the locked-document challenge-rationale gate.

Any future material change must check implications across:

- onboarding/frontload
- handoff schema/generation
- state freshness
- repository/product classification
- capability staffing
- privacy/data residency
- publication routing

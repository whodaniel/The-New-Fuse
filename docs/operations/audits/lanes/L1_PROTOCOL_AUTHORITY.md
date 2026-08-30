# L1 — Protocol / Authority Lane Receipt

`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:AUDIT_REPORT] [VISIBILITY:COLLECTIVE] [OWNER:TNF]`

**Lane:** L1 Protocol/Authority · **Mode:** REPORT ONLY (no refactors)
**Mandate:**
`docs/operations/audits/FULL_ENCHILADA_HARNESS_PLATFORM_AUDIT_MANDATE_2026-08-09.md`
**Run:** 2026-08-09 · branch `fix/honest-failure-reporting` @ `8a762b98d0`
**Surfaces:** `docs/protocols/*`, `tnf protocol gate`, `tnf state show`,
`PROTOCOL_MAP.md`, `LIVING_STATE.md`, `AGENT_STATUS_LEDGER.md`

---

## Executive verdict

The protocol layer is **substantively strong and operationally untrustworthy**.
The content is unusually good — 78 protocol files, 13 machine schemas, a real
Turn Zero implementation, a working gate harness. What fails is the **authority
signalling**: the gate contradicts itself in a single run, the designated state
SOT is stale and textually degraded, the designated index covers 23% of the
corpus, and four `[CLASS:PRIME]` protocols cannot report their own status to the
system's own parser.

An operator who trusts the summary line is misled. That is the through-line of
every P0/P1 below.

---

## P0 — `tnf protocol gate` reports success and fails

**Evidence.** Single run, captured to `scratchpad/gate.log`:

```
Result:
  ALL PROTOCOLS PASSED

[TNF Protocol Gate]
Mode: ci
[turn-zero-authority]    OK (ci)
[handoff-source-drift]   OK (ci)
[session-handoff-gate]   BLOCKED (ci): Critical-path changes require fresh
                         handoff artifacts. Missing in this change set:
                         docs/protocols/reports/SESSION_HANDOFF_LATEST.json,
                         docs/protocols/reports/SESSION_HANDOFF_LATEST.md
Protocol gate failed: node exited with code 1
```

`REAL_EXIT=1`, four lines after `ALL PROTOCOLS PASSED`.

**Impact.** Two grading systems print into one stream with no precedence
declared. The green summary belongs to the _protocol checks_; the exit code
belongs to the _gate_. Any operator or script reading the summary — or piping
through `tail`, which drops the real status — concludes the gate passed. This is
the highest-leverage finding in the lane because it silently invalidates every
other check the gate performs.

**Recommended fix.** One verdict per run. Print the gate result **after** the
summary and make the summary conditional on it, or relabel the summary "Protocol
checks passed — gate verdict below". Owner: L1 + harness owner.

---

## P1 — `LIVING_STATE.md` is stale and textually degraded

**Evidence.**

```
LIVING_STATE claims Head : 1703dea33849   ("docs(protocols): add Agent Workspace
                                            Isolation Protocol")
actual HEAD              : 8a762b98d001
commits behind           : 2
Head refs in file        : 21
Handoff IDs in file      : 4
"Current Directive"      : 1 occurrence, containing 11+ concatenated states
```

`tnf state show` renders that field as a run-on paragraph:

> `Current Directive: … **Handoff:** a9924b4e… **Head:** 1703dea33849 continuation.resume_checklist. **Project ID:** TNF-SESSION **Handoff:** d9e5c9ce… **Head:** 99e5152edc43 … **Handoff:** e9278705… **Head:** da185b398393 paths. **Project ID:** …`

**Impact.** `LIVING_STATE.md` is tagged `[STATUS:SYNCHRONIZED]`, is one of the
three files Turn Zero reads at Step 1, and is what the gate cites as the "active
directive". It is neither synchronized nor parseable. Successive writers have
**appended instead of replaced**, so the current directive is now sediment: an
agent reading it cannot determine which of eleven directives is live. The
`SYNCHRONIZED` tag is asserted by the file about itself and validated by
nothing.

**Impact is compounded** by P0 — Step 8 of Turn Zero passes on the mere presence
of the `[STATUS:SYNCHRONIZED]` string, not on the state being fresh or coherent.

**Recommended fix.** Make the directive block single-valued and machine-written
(replace semantics, not append); validate `Head` against `git rev-parse HEAD`
during Turn Zero and warn on drift. Owner: L1 + L7 (state governor).

---

## P1 — Four `[CLASS:PRIME]` protocols report `STATUS:null` to TNF's own parser

**Evidence.** From the gate's Procedural Disclosure step:

```
docs/protocols/TNF_COLLISION_PROVISION.md:                    [CLASS:PRIME] [STATUS:null]
docs/protocols/TNF_CONCURRENT_AGENT_COORDINATION_PROTOCOL.md: [CLASS:PRIME] [STATUS:null]
docs/protocols/TNF_GOVERNANCE_TENETS.md:                      [CLASS:PRIME] [STATUS:null]
docs/protocols/TNF_RESOURCE_STRATEGY.md:                      [CLASS:PRIME] [STATUS:null]
```

Root cause confirmed — these declare status in **prose**, not the bracket tag
the parser reads:

```
TNF_COLLISION_PROVISION   **Status:** ACTIVE      ← prose
TNF_GOVERNANCE_TENETS     **Status:** ACTIVE      ← prose
```

`TNF_DOCUMENT_TAGGING_PROTOCOL` (itself `[STATUS:LOCKED]`) mandates
`[CLASS] [STATUS] [DOC_TYPE] [VISIBILITY]`.

**Impact.** `TNF_COLLISION_PROVISION` governs all shared-resource collisions
including git working-tree destruction; `TNF_GOVERNANCE_TENETS` is a governance
root. The system loads them, classifies them PRIME, and cannot tell whether they
are active, draft, or archived. Any gate keying on `STATUS` treats them as
unknown.

**Recommended fix.** Add the bracket tags. This is a four-line change, but see
the P1 below — the validator that should have caught it does not look at these
files. Owner: L1.

---

## P1 — `PROTOCOL_MAP.md` indexes 23% of the protocol corpus

**Evidence.**

```
docs/protocols/*.md files : 78
referenced in PROTOCOL_MAP : 18   (23%)
```

**Impact.** `PROTOCOL_MAP.md` is `[CLASS:PRIME] [STATUS:ACTIVE]` and is the
declared entry point for protocol discovery. 60 protocols are reachable only by
already knowing their filename. This is the direct cause of duplicate-protocol
authorship: an agent that cannot find `TNF_COLLISION_PROVISION` writes a new
collision protocol. (Observed this session — a workspace-isolation protocol was
authored without discovering that C2 already claimed git working-tree
collisions; both now cross-reference, but only because the overlap was found by
manual search.)

**Recommended fix.** Generate the map from `docs/protocols/*.md` rather than
maintaining it by hand; a hand-maintained index of a 78-file corpus will always
drift. Owner: L1.

---

## P2 — `DIRECTIVES` is a four-surface dual SOT with inverted naming

**Evidence.**

| File                             | Status                  | Lines |
| -------------------------------- | ----------------------- | ----- |
| `DIRECTIVES.md`                  | `[STATUS:LOCKED]`       | 647   |
| `TNF_DIRECTIVES.md`              | `[STATUS:ARCHIVED]`     | 361   |
| `LIVING_DIRECTIVES_CARD.md`      | `[STATUS:SYNCHRONIZED]` | 82    |
| `DIRECTIVE_CONVERSION_LEDGER.md` | `[STATUS:PENDING]`      | 184   |

**Impact.** The `TNF_` prefix marks the **archived** copy while the unprefixed
file is canonical — the opposite of the convention everywhere else in
`docs/protocols/`, where `TNF_` marks first-class protocols. An agent resolving
"the directives" by prefix picks the archived 361-line copy. Directives are
cited by number (`D7`, `D14`, `D23`) across the corpus with no file qualifier,
so the reference is ambiguous by construction.

**Recommended fix.** Rename the archived copy into `_archive/` and keep the
number-space in exactly one file; make `LIVING_DIRECTIVES_CARD` an explicit
generated view of it. Owner: L1.

---

## P2 — `AGENT_STATUS_LEDGER.md` is a Turn Zero state file tagged `PENDING`

**Evidence.**

```
`[CLASS:INTEL] [STATUS:PENDING]` `[DOC_AUDIT_BACKFILL:2026-07-14]` — header
restored for Gate 3 compliance; reclassify on next vetting pass.
```

Turn Zero Step 1 reads it as one of three state files. Last content update
`2026-08-09T18:16:11.985Z`; the "reclassify on next vetting pass" note is dated
**2026-07-14** — ~4 weeks unactioned.

**Impact.** A file the boot sequence treats as authoritative state is classified
`INTEL` (informational) with `PENDING` status. Class and role disagree, so
neither can be trusted to gate anything.

**Recommended fix.** Promote to `[CLASS:PRIME] [STATUS:ACTIVE]` if Turn Zero
depends on it, or stop reading it as state. Owner: L1 + L7.

---

## P2 — `SESSION_HANDOFF` is spread across 8+ surfaces with divergent naming

**Evidence.**

```
docs/protocols/SESSION_HANDOFF_ENFORCEMENT.md
docs/protocols/SESSION_HANDOFF_TEMPLATE.md
docs/protocols/reports/SESSION_HANDOFF_LATEST.{json,md}
docs/protocols/reports/SESSION_HANDOFF_b61890f2.{json,md}
docs/development-and-troubleshooting/NEXT_SESSION_HANDOFF.md
docs/development-and-troubleshooting/NEXT_SESSION_HANDOFF.md.backup
```

**Impact.** `NEXT_SESSION_HANDOFF.md` lives in a different tree, uses a
different name for the same concept, and has a `.backup` sibling tracked in git.
The gate validates `SESSION_HANDOFF_LATEST.*` only; the `NEXT_` variant is
unvalidated and will be read by any human who finds it first. Note the gate's
own `handoff-source-drift` check reports **OK** — it verifies the canonical
pointer, not the existence of competing surfaces, so this class of drift is
invisible to it.

**Recommended fix.** Archive `NEXT_SESSION_HANDOFF.md*`; extend
`handoff-source-drift` to fail on any unregistered `*HANDOFF*` surface under
`docs/`. Owner: L1.

---

## P3 — `ASSIMILATE_CHECK` silently skips

**Evidence.**

```
Step 7: ASSIMILATE_CHECK...
  ~ failure-log scan [SKIPPED]
      no .jsonl files in <USER_HOME>/.hermes/cron/output — nothing to scan
```

**Impact.** Counted as a warning, not a failure, and the run still reports "Turn
Zero passed (… 1 step(s) skipped)". A gate step whose input path is empty has
never run; an empty input directory is indistinguishable from a healthy one. Low
severity today because the step is advisory, but it is the same
"green-over-nothing" pattern as P0.

**Recommended fix.** Distinguish _no failures found_ from _no input present_,
and surface the latter as a configuration warning naming the expected producer.
Owner: L2.

---

## P3 — Turn Zero has 8 surfaces; canonicality asserted, not visible

**Evidence.**

```
docs/protocols/TURN_ZERO_MANDATE.md           ← canonical
.verifier/turn-zero-atlas.mjs
.verifier/whole-codebase/**/A07-turn-zero-authority.json   (×2)
cursor-marketplace/plugins/tnf-harness/commands/tnf-turn-zero.md
cursor-marketplace/plugins/tnf-harness/rules/tnf-turn-zero.mdc
cursor-marketplace/plugins/tnf-harness/skills/tnf-turn-zero-orientation/SKILL.md
packages/claw-skills/turn-zero-validator/SKILL.md
```

Gate reports
`[turn-zero-authority] OK (ci): canonical Turn Zero authority and references are aligned`.

**Impact.** The machine check passes and is trustworthy. The **human** path is
not: nothing in `TURN_ZERO_MANDATE.md`'s vicinity states that it is the one
canonical source and the other seven are mirrors. A contributor editing the
Cursor rule file has no signal that it is downstream.

**Recommended fix.** A one-line canonical-source header in each mirror pointing
at `TURN_ZERO_MANDATE.md`. Owner: L1.

---

## Answers to the mandate's mission questions (L1 scope)

**1. What makes sense — keep.** The gate harness architecture (named checks,
per-check verdicts, CI mode) is genuinely good and worth doubling down on.
`docs/protocols/schemas/` (13 JSON schemas) is the strongest authority surface
in the repo: machine-checkable and unambiguous. **When prose and schema
disagree, the schema has been right every time examined.**

**2. What is missing.** Validation coverage, not validators.
`validate-doc-tagging.cjs` scans a **hardcoded 7-file allowlist** plus
`docs/library/` — it never inspects the other 81 protocol docs, which is exactly
why the four `STATUS:null` PRIME protocols went unnoticed. Per
`TNF_ARTIFACTS_LIFECYCLE_PROTOCOL` rule 5, a rule is not in force until a script
references it _and_ that script runs in CI. By that standard most of the tagging
protocol is not in force.

**3. What is confusing.** In order of operator cost: the gate's two verdicts
(P0); `TNF_`-prefix meaning "archived" for DIRECTIVES only (P2);
`SESSION_HANDOFF` vs `NEXT_SESSION_HANDOFF` (P2); `LIVING_STATE` claiming
`SYNCHRONIZED` while carrying eleven directives (P1).

**4. What to refactor.** Generate `PROTOCOL_MAP.md` from the directory. Make
`LIVING_STATE`'s directive block machine-written and single-valued. Collapse the
DIRECTIVES surfaces to one file plus generated views.

**5. Best user flow (L1 slice).** `tnf protocol gate` → **one** verdict line →
on failure, the named check and the exact remediation command. Today an operator
must read ~120 lines and know that the exit code outranks the summary.

---

## Cross-lane notes

- **L2/L7:** `LIVING_STATE` append-instead-of-replace is a state-governor
  concern, not a docs concern.
- **L0:** P0 affects every lane that shells out to `tnf protocol gate` and reads
  stdout. Any lane reporting "gate passed" from summary text should re-verify by
  exit code.

## Method / verification note

All findings above are from live command output or file inspection, captured
this run. Gate output preserved at `scratchpad/gate.log`, state output at
`scratchpad/state.log`. Exit codes were captured directly (`REAL_EXIT=$?`)
rather than through a pipe — piping `tnf protocol gate` through `tail` returns
`0` and would have hidden P0 entirely.

No files were modified in this lane.

`[CLASS:INTEL] [STATUS:PENDING]`

# Authority Stack — Logical Coherence Audit + Protocol Review

**Date:** 2026-07-24  
**Repo:** `$TNF_ROOT`  
**Branch:** `fix/a2a-signature-verification`  
**Head (audit):** `9c7e6bd7a1` —
`feat(authority): close A2A/HTTP fail-open gaps and sign bus publishers`  
**Frameworks:** MECE Logic Tree (primary); Cynefin (secondary)  
**Method:** Read protocol docs; read-only cross-check against cited code. No
commits.

---

## Cynefin classification

**Overall turn-up problem: Complex (with a Complicated engineering core).**

Enforcement wiring (shim, `SecureAuthGuard` USER default, broker/relay signing,
consumer chokepoint) is **Complicated**: cause→effect is knowable by expertise,
and the recent commit closes known fail-open gaps. Making the stack
_load-bearing_ is **Complex**: live worker uids, operator key custody, PR merge
timing, encryption migration across consumers, and when to flip
`TNF_AUTHORITY_CONSUMER` / `TNF_MESSAGE_AUTH_MODE=enforce` are emergent and must
be probed (pilot → sense → respond). Treating isolation as Clear (“account
exists ⇒ boundary”) already produced a false-pass under `sudo tnf authority` —
classic Complex failure mode. **Disorder** appears only where docs disagree with
each other (integration-map sequencing vs runbook; D23 stale bullets); resolve
Disorder by privileging runbook + live probe over narrative history.

**Sense–probe–respond for operator turn-up; analyze–reduce for remaining doc
honesty patches and gateway parity.**

---

## Direct answers

### 1. Are runbook steps still ordered correctly after enforcement code landed?

**Yes, with one clarification.** Enforcement code does **not** change the
authority-path order: isolate workers → prove isolation → pilot consumer flag →
fan out → (optional) message-auth warn→enforce. Phase A (encryption) remains
independent. Phase B (merge PR #70) before flipping production flags remains
correct. Phase D’s HTTP note (`SecureAuthGuard` → USER) is accurate post-
`9c7e6bd7a1`. Do **not** move consumer enable before C2/C3 — that would
contradict trust-root honesty and Phase 4a’s “weak root → more restrictive”
policy.

### 2. Is “never sudo tnf authority” still consistent everywhere?

**Yes in operator-facing authority docs** (runbook, `AUTHORITY_README`,
`LIVING_STATE`, challenge log 2026-07-24 sudo false-pass entry). Nested
`sudo -u tnf-agent` remains explicitly allowed. No contradictory instruction
found in those surfaces. Keep reinforcing: wrong = `sudo tnf authority …`; right
= normal-user `tnf authority …`.

### 3. Does anything now overclaim isolation / enforce / consumer strength?

**Yes — several narrative surfaces still overclaim or under-update:**

| Claim surface                                                               | Overclaim / stale claim        | Reality                                                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| D23 bullet “approval channel does not yet”                                  | Implies Phase 3 missing        | Phase 3 + console exist (same D23 later bullets)                                                                         |
| D23 “selected root is `file`” / agents on operator uid as the only story    | Implies no `separate-uid` path | Account uid 442 exists; probe selects `separate-uid` available-but-**degraded** until strong attestation + no stragglers |
| `AUTHORITY_INTEGRATION_MAP` §1 “Everything above Phase 0 is not yet called” | Implies no consumer            | Chokepoint wired; default-off (`TNF_AUTHORITY_CONSUMER`)                                                                 |
| Pathway map §2.3 title + “Gap: thin client bypasses auth”                   | Implies bypass still open      | Shim closed at `9c7e6bd7a1` (gaps section already says closed)                                                           |
| Pathway map P09 “PUBLIC default”                                            | Fail-open HTTP                 | Code defaults USER; gaps section closed                                                                                  |
| Integration map §4 step order (consumer → then migrate)                     | Invert vs runbook              | Runbook C2→C3→C4 is the load-bearing order                                                                               |

Honest claims that remain correct: consumer **default-off**; message auth
**warn** until keys + enforce; gateway still **opt-in** `GatewayAuthGuard`;
`sign-bus-message` **fail-open to unsigned** if signing throws; Phase 4b
deferred; isolation not load-bearing while workers on uid 501.

### 4. What protocol text should be patched?

See **Patch list** below. Do **not** silently edit `DIRECTIVES.md` (LOCKED)
without challenge-rationale ledger + operator confirmation.

---

## MECE tree (status per leaf)

Legend: **COHERENT** | **DRIFT** | **CONTRADICTION** | **DEFERRED**

### A. Identity & message auth (Phase 0–1)

- **A1. Ed25519 identity + `resolveRole(verifiedId)`** — **COHERENT**  
  Evidence: D23 sanctioned lookup; `tnf-identity` / `tnf-message-auth` cited in
  pathway P01; `kid: shared` ≠ identity in enforce.
- **A2. Default `TNF_MESSAGE_AUTH_MODE=warn`** — **COHERENT**  
  Evidence: pathway map; `tnf-agent-cli.cjs` comment (~L262); runbook Phase D
  does not flip on merge.
- **A3. Enforce only after keypairs + peer pubs** — **COHERENT**  
  Evidence: runbook Phase D; `AUTHORITY_README` load-bearing list; challenge
  “enforcement gaps closed” entry explicitly does **not** flip enforce.
- **A4. Thin-client unsigned publish gap** — **COHERENT (code)** /
  **CONTRADICTION (pathway §2.3 body)**  
  Evidence: `redis-agent-client.cjs` is shim over full client; pathway gaps mark
  closed; §2.3 still titled “no A2A auth/authority”.
- **A5. Broker/relay TNF envelope signing** — **COHERENT**  
  Evidence: `sign-bus-message.ts` used by `broker-agent.ts` /
  `redis-relay-bridge.ts`; fail-open on sign throw documented in file header.
- **A6. Remaining unsigned publishers (master-clock / director telemetry)** —
  **DEFERRED** (honestly listed in pathway gaps #7).

### B. Trust root & isolation (Phase 2 / turn-up C3)

- **B1. `tnf-agent` account exists (uid 442)** — **COHERENT**  
  Evidence: runbook status table; `LIVING_STATE`; challenge probe fix entry.
- **B2. Workers still on uid 501 → not load-bearing** — **COHERENT**  
  Evidence: runbook C2 ❌; challenge sudo false-pass; README “Until workers are
  off uid 501…”.
- **B3. `confirm-isolation` refuses strong guarantee with stragglers / SUDO_UID
  fix** — **COHERENT**  
  Evidence: challenge log; runbook “Never wrap the whole CLI in sudo”.
- **B4. D23 “selected root is `file`”** — **DRIFT**  
  Evidence: provider order prefers `separate-uid` before `file`; account exists
  ⇒ selection is `separate-uid` degraded, not silent `file`. D23 known-
  limitation paragraph still true on _strength_ (no kernel boundary yet) but
  misnames the selected kind.
- **B5. Never `sudo tnf authority`** — **COHERENT** across runbook, README,
  LIVING_STATE, challenge log.

### C. Elevation & grants (Phase 3)

- **C1. Elevation broker + interactive review console** — **COHERENT**  
  Evidence: D23 Phase 3 bullets; modules in README; runbook C4
  `tnf authority review`.
- **C2. D23 stale “approval channel does not yet”** — **CONTRADICTION**  
  Evidence: `DIRECTIVES.md` ~L221 vs ~L228 (“The approval channel exists”).
- **C3. Agent cannot `decide()`; strength depends on trust root** —
  **COHERENT**  
  Evidence: D23; challenge Phase 3 entry; degraded-root honesty.

### D. Credential broker (Phase 4a/4b)

- **D1. Phase 4a read-only + degraded-root more restrictive** — **COHERENT**  
  Evidence: D23; README; challenge Phase 4a entry.
- **D2. Phase 4b mutation** — **DEFERRED**  
  Evidence: runbook Phase E; README “Not built”; D23 explicit.
- **D3. `agentApiGrants` ↔ `CredentialBroker` reconciliation** — **DEFERRED**  
  Evidence: integration map §3; runbook Phase E.

### E. HTTP surface enforcement

- **E1. `apps/api` `SecureAuthGuard` default USER** — **COHERENT**  
  Evidence: `secure-auth.guard.ts` L110–121; runbook Phase D HTTP note;
  challenge enforcement entry; pathway gaps closed #5.
- **E2. Pathway P09 still “PUBLIC default”** — **CONTRADICTION**  
  Evidence: `CODEBASE_PATHWAY_MAP_2026-07-24.md` ~L452 vs gaps/dead table.
- **E3. Gateway opt-in `GatewayAuthGuard` (no global APP_GUARD)** — **COHERENT
  as documented gap**  
  Evidence: pathway gaps #6; challenge “parity gap documented, not silently
  claimed closed”; gateway controllers use `@UseGuards(GatewayAuthGuard)`
  selectively.
- **E4. Explicit PUBLIC allowlist on health/auth/public-info/bridges/webhook-
  incoming** — **COHERENT** (commit touches those controllers + guard).

### F. Bus publishers & consumers

- **F1. Consumer gate at `handleIncomingMessage` / `gateAndDispatch`** —
  **COHERENT**  
  Evidence: `tnf-agent-cli.cjs`; `tnf-wrapper-authority.cjs` default-off;
  runbook; integration map §4 afternoon update.
- **F2. Integration map §1 “not yet called by any agent”** — **CONTRADICTION**  
  Evidence: §1 vs §4 “DONE (wrapper half)” same file; code path exists.
- **F3. Authority-shaped `{with,can}` vs broker skill-string caps** — **COHERENT
  (partial)**  
  Evidence: wrapper extracts only `{with,can}`; nested `payload.task` paths;
  pathway gaps #4 deferred full shared policy.
- **F4. Shim outbound sign + inbound auth** — **COHERENT**  
  Evidence: `redis-agent-client.cjs` wraps `publish` + `onMessage('*')`.
- **F5. Consumer strength when flag unset** — **COHERENT (honest inert)**  
  No overclaim in runbook/README; load-bearing requires flag + caps + isolation.

### G. Operator CLI / runbook procedural coherence

- **G1. Order: A encrypt → B merge → C isolate → C4 flag → D enforce** —
  **COHERENT** with post-enforcement reality.
- **G2. Integration map §4 “wire consumer then migrate launcher”** —
  **CONTRADICTION** vs runbook C2→C4 and README step 2→3.  
  Library/wrapper wiring is done; _enablement_ must follow isolation.
- **G3. Operator processes stay uid 501** — **COHERENT** (runbook, map §2).
- **G4. Pilot-only env for `TNF_AUTHORITY_CONSUMER`** — **COHERENT**.

### H. Documentation honesty (D23)

- **H1. Challenge log tracks enforcement + sudo false-pass** — **COHERENT**.
- **H2. Pathway map mixed stale body vs updated gaps** — **DRIFT /
  CONTRADICTION** (§2.3, P09 vs gaps).
- **H3. D23 internal stale grant/approval sentence** — **CONTRADICTION** (LOCKED
  — needs ledgered patch).
- **H4. D23 trust-root “file” naming vs live `separate-uid` degraded** —
  **DRIFT** (LOCKED — needs ledgered patch).
- **H5. Runbook / README / LIVING_STATE on isolation honesty** — **COHERENT**.

---

## Top contradictions / drifts (severity ranked)

1. **CRITICAL — D23 internal contradiction** (`DIRECTIVES.md` ~L221):  
   “Capability grants exist; the approval channel does not yet” vs later “The
   approval channel exists (Phase 3).” Agents citing the first bullet would
   fabricate under-authorization of the stack’s maturity (or confuse operators
   about what exists).

2. **HIGH — Integration map §1 vs live consumer wire**  
   “Everything above Phase 0 is not yet called by any agent” is false; gate is
   wired and default-off. Misleads sequencing and grep-based audits.

3. **HIGH — Integration map §4 sequencing inverted vs runbook**  
   “Integrate consumer → then migrate launcher” conflicts with C2→C3→C4
   (isolation before enable). Risk: operator enables consumer on uid-501 workers
   and treats elevation as load-bearing under a weak root.

4. **HIGH — Pathway map P09 “PUBLIC default”**  
   Directly contradicts code + gaps table; reintroduces the fail-open story
   after it was closed.

5. **MEDIUM — Pathway map §2.3 thin-client gap narrative**  
   Body still describes bypass; gaps say closed. Same honesty class as #4.

6. **MEDIUM — D23 “selected root is `file`”**  
   Strength claim (no real boundary yet) is still right; kind name and
   “separate-uid would make it one” understate that `separate-uid` is already
   selected-but-degraded pending worker migration + strong confirm-isolation.

7. **LOW — Runbook commit pin `e01f85cc17` for consumer gate**  
   Still true for gate landing; enforcement close-out is `9c7e6bd7a1`. Cosmetic
   drift unless readers think head === gate commit only.

---

## Patch list (concrete)

### Locked (require challenge rationale + operator OK)

**`docs/protocols/DIRECTIVES.md` (D23)**

1. **Delete or rewrite** the bullet starting  
   `Capability grants exist; the approval channel does not yet.`  
   Replace with a single grants bullet that does **not** deny Phase 3, e.g.  
   “Capability grants exist (UCAN-shaped…).” Approval channel already covered in
   the following bullet.
2. **Rewrite trust-root workstation paragraph** (~L270–278):
   - State selected kind as **`separate-uid` (available, degraded)** while
     workers share operator uid / strong marker absent.
   - Keep: not a kernel boundary until isolation proven; Secure Enclave N/A on
     this Mac; do not cite as enforced.
   - Append ledger entry in `CHALLENGE_RATIONALE_LOG.md`.

### Non-locked (safe honesty fixes)

**`docs/protocols/AUTHORITY_INTEGRATION_MAP.md`**

3. **§1 rewrite:** Replace “not yet called by any agent” with:  
   consumer is wired at `RedisAgentClient.handleIncomingMessage` /
   `tnf-wrapper-authority.gateTask`, **default-off** via
   `TNF_AUTHORITY_CONSUMER`; not load-bearing until flag + authority-shaped
   caps + non-degraded isolation.
4. **§4 reorder:** Align with runbook — (1) migrate pilot worker to `tnf-agent`,
   (2) `confirm-isolation` as normal user, (3) enable consumer on that unit, (4)
   fan out; note library/chokepoint wiring already done.
5. Add one-line pointer to this audit + runbook as sequencing source of truth.

**`docs/protocols/reports/CODEBASE_PATHWAY_MAP_2026-07-24.md`**

6. **§2.3:** Retitle to “Thin Redis client (shim → full `RedisAgentClient`)”;
   remove “Gap: bypasses Phase-0”; point to shim file + closed gap #3.
7. **P09 Gates line:** Change `PUBLIC default` →
   `USER default (fail-closed; PUBLIC opt-in / emergency env)`.

**`docs/protocols/AUTHORITY_TURNUP_RUNBOOK.md` (optional)**

8. Status blurb: mention enforcement close-out commit `9c7e6bd7a1` alongside
   consumer gate `e01f85cc17`.
9. Keep “Do not reverse the order” and never-sudo block unchanged.

**`scripts/lib/AUTHORITY_README.md`**

10. No mandatory change; already aligned. Optional: note gateway parity still
    open (cross-link pathway gaps #6).

---

## Recommended next steps

### Operator (Complex / probe)

1. As **normal user** (not `sudo tnf`): `tnf authority workers` →
   `relaunch-workers` → `confirm-isolation` → `status` until strong
   `separate-uid` (no uid-501 worker stragglers).
2. Pilot only: `TNF_AUTHORITY_CONSUMER=1` on one `tnf-agent` unit; exercise
   approve/deny/plain-task paths per runbook C4.
3. Complete A2/A3 encryption migration if still open; keep A independent of C.
4. Review/merge PR #70 when satisfied; do **not** flip enforce/consumer as part
   of merge.
5. Approve a ledgered D23 honesty patch (#1–2 above) when ready.

### Engineering (Complicated / analyze)

1. Apply non-locked doc patches (#3–7) immediately for D23-class honesty.
2. Do **not** flip `TNF_MESSAGE_AUTH_MODE=enforce` or fleet-wide consumer in
   code defaults.
3. Track remaining gaps without overclaim: gateway global guard parity;
   master-clock/director unsigned publishes; Phase 4b; skill-string vs
   `{with,can}` shared policy.
4. Keep `sign-bus-message` fail-open behavior documented until enforce mode +
   universal keying make unsigned publishes unacceptable.

---

## Structured output (machine-readable summary)

```json
{
  "framework": "MECE Logic Tree + Cynefin",
  "cynefin": {
    "domain": "Complex",
    "engineering_core": "Complicated",
    "disorder_pockets": [
      "AUTHORITY_INTEGRATION_MAP sequencing vs runbook",
      "D23 stale approval-channel denial"
    ],
    "strategy": "Sense-probe-respond for turn-up; analyze-reduce for doc honesty"
  },
  "direct_answers": {
    "runbook_order_still_correct": true,
    "never_sudo_tnf_authority_consistent": true,
    "overclaims_present": true,
    "locked_doc_patches_need_operator": true
  },
  "severity_ranked": [
    "D23 approval-channel does-not-yet vs exists",
    "Integration map §1 not-yet-called",
    "Integration map §4 consumer-before-isolation",
    "Pathway P09 PUBLIC default",
    "Pathway §2.3 thin-client gap stale",
    "D23 selected-root file naming drift"
  ],
  "code_verified_coherent": [
    "SecureAuthGuard default USER",
    "redis-agent-client shim",
    "tnf-wrapper-authority default-off",
    "sign-bus-message on broker/relay",
    "consumer gate at handleIncomingMessage"
  ],
  "audit_commit_context": "9c7e6bd7a1",
  "edits_made_this_audit": [
    "AUTHORITY_INTEGRATION_MAP.md §1/§4 (handoff 31380d1611)",
    "CODEBASE_PATHWAY_MAP addendum + JSON gaps (31380d1611)",
    "DIRECTIVES.md D23 honesty + CHALLENGE_RATIONALE_LOG (follow-up)",
    "pathway/coherence graph refresh"
  ]
}
```

---

_Audit authored by logical-reasoning-agent + pathway-tracer + graph-writer,
2026-07-24. Cross-checked against cited paths; deliverable path:
`docs/protocols/reports/AUTHORITY_COHERENCE_AUDIT_2026-07-24.md`. D23 LOCKED
honesty patch ledgered after operator requested this review._

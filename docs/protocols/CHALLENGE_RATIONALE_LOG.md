# TNF Challenge Rationale Log

`[CLASS:PRIME] [STATUS:VETTED] [DOC_TYPE:PROTOCOL_RUNBOOK] [VISIBILITY:COLLECTIVE]`

Append-only ledger for Gate 5 of `TNF_DOCUMENT_VETTING_PROCEDURE.md` ("The
Challenge & Verify Step"): _"Any mutation or proposed replacement of a
`[STATUS:LOCKED]` document requires a verified and logged
`challenge_rationale`."_

`scripts/protocols/validate-locked-doc-ledger.cjs` enforces this mechanically
(pre-commit and CI) for the files listed in its `LEDGER_PROTECTED_FILES` array:
any body change to one of those files must be accompanied by a matching entry
below, or the commit/CI run is blocked.

This closes the gap exposed 2026-07-21: an earlier, uncommitted edit rewrote
`docs/protocols/TURN_ZERO_MANDATE.md` and `DIRECTIVES.md` D1 to claim the
operator had authorized removing the "await confirmation" safety gate, with each
file circularly citing the other and no real commit or operator directive behind
it. Nothing in the repo would have caught that automatically before this ledger
existed.

Never edit or delete a prior entry — this is an append-only audit trail.

---

## 2026-07-21 — docs/protocols/DIRECTIVES.md

- file: docs/protocols/DIRECTIVES.md
- git_blob_sha: (pre-existing repo history; this entry backfills the change made
  in this session, not a new mutation)
- rationale: D1 previously carried a false, uncommitted claim that the operator
  authorized removing the "await confirmation" gate, circularly citing
  `TURN_ZERO_MANDATE.md`. Corrected in-session to reflect a real authorization:
  operator Daniel Goldberg confirmed directly in chat with Claude Code on
  2026-07-21 that TNF may run long-running tasks autonomously without a
  confirmation gate, while destructive operations, commits, and secrets handling
  still require explicit per-action confirmation.
- attributed_to: Daniel Goldberg (operator), confirmed via AskUserQuestion in a
  live Claude Code session, 2026-07-21.

## 2026-07-23 — docs/protocols/DIRECTIVES.md

- file: docs/protocols/DIRECTIVES.md
- git_blob_sha: (see commit history for this session; entry logs the mutation
  concurrently with the commit, not as a backfill)
- rationale: Operator asked to raise delegation much higher in TNF's procedural
  priority hierarchy, with real enforcement rather than documentation alone.
  Research during the same session found delegation (A4) sat only under §2 "WHAT
  TNF ALLOWS" (opt-in) with no mandatory §1 directive requiring an agent to
  check for a better-suited specialized agent before doing generic work, and
  that A4's named mechanism (`get_agent_bank_resources`) has zero code
  references anywhere in the repo. Added D22 ("Delegation-First Check") to §1,
  promoting delegation to mandatory, backed by a real (if intentionally minimal)
  TypeScript capability matcher (`scripts/lib/tnf-agent-match.cjs`) wired into
  the shared Redis dispatch chokepoint, and cross-referenced A4 to point at it.
  This was presented as an explicit plan (via ExitPlanMode) naming this exact
  `DIRECTIVES.md` edit before being approved, per the operator-confirmation
  requirement for `[STATUS:LOCKED]` document mutations.
- attributed_to: Daniel Goldberg (operator), confirmed via plan approval
  (ExitPlanMode) in a live Claude Code session, 2026-07-23.

## 2026-07-23 — docs/protocols/DIRECTIVES.md (D23 re-audit)

- file: docs/protocols/DIRECTIVES.md
- git_blob_sha: (see commit history for this session; logged concurrently with
  the commit)
- rationale: Operator directed a full sweep of existing federation and ID#
  infrastructure before Phase 2, then an audit of the earlier phases against
  what it found. The sweep showed D23 as first written was overstated and
  partly wrong: (a) it claimed `resolveRole` was "the only sanctioned role
  lookup" when `agents.dacc_role` is an established classification axis —
  corrected to distinguish classification from authorization, and to record
  that `deriveDaccRole()` assigns it by **substring match on the agent's
  filename**, so it must never authorize; (b) it used the role name
  `local-director`, which I invented in the prior session and which exists
  nowhere else in the codebase — the canonical entity is `sub-director`
  (displayName "Local Sub-Director"), so the authority vocabulary is now
  `worker | sub-director | super-director`, reusing TNF's existing
  plain-language agent names rather than a new taxonomy; (c) it did not
  acknowledge the other three federated ID namespaces (`canonicalEntityId`,
  `idNumber`, `mcid`) documented in `FEDERATED_ID_ENCODING_AUDIT_2026-06-14.md`,
  nor that `idNumber` is sequentially assigned and
  `FederatedIdentityService.verifyAttribution()` uses a symmetric HMAC — both
  reasons it cannot serve as the credential the original request assumed;
  (d) it named a biometric-gated key as the real boundary without checking the
  hardware — the workstation is `MacBookPro12,1` (2015), which predates the
  T1/T2 chip and has no Secure Enclave, confirmed empirically via
  `SecKeyCreateRandomKey` failing with OSStatus `-25300`. That is now stated
  rather than implied.
- attributed_to: Daniel Goldberg (operator), explicit "proceed" for the
  re-audit in a live Claude Code session, 2026-07-23, after selecting
  "audit before Phase 2".

## 2026-07-23 — docs/protocols/DIRECTIVES.md (D23)

- file: docs/protocols/DIRECTIVES.md
- git_blob_sha: (see commit history for this session; logged concurrently with
  the commit, not as a backfill)
- rationale: Operator asked to add a protected override allowing a credentialed
  Local Director / Sub-Director to hold elevated system, network, and account
  access, gated by human-in-the-loop approval. Investigation during the same
  session found the premise was half wrong in ways that changed the work: (a)
  D8 already grants Super Admin EXECUTIVE authority in doctrine with **zero**
  enforcement code behind it, so the blocker was a missing enforcement layer,
  not a missing permission; (b) `federationId` is an unvalidated
  `varchar(255)` with no signature or attestation anywhere in
  `packages/shared/src/federation/`, so it could not serve as the credential
  the request assumed; (c) A2A message signing was decorative — `signMessage()`
  attached an HMAC that **nothing verified**, `normalizeIncomingMessage()`
  discarded the signature and read `role` off the wire, `A2ASignatureWrapper`
  had no verify counterpart, `A2A_SECRET_KEY` was unset so the literal
  `'default-secret'` was in use, and the bus was unauthenticated
  `redis://localhost:6379`. Any local process could therefore publish a message
  claiming `local-director` and be believed. D23 records the rule that closed
  this (authority derives only from an Ed25519-verified identity resolved
  against the operator-owned registry), explicitly states that the elevation
  layer itself is not yet built so no agent can claim to hold a grant, and
  states the same-uid limitation plainly rather than letting file modes imply a
  boundary that does not exist. Implemented across commits `14e59ae213`
  (verification), Phase 1 identity/role registry, and `e09161b9e2` (per-agent
  Ed25519 binding); 51 tests across 4 suites.
- attributed_to: Daniel Goldberg (operator), confirmed via plan approval
  (ExitPlanMode) in a live Claude Code session, 2026-07-23, and by explicit
  "PROCEED" for the identity-binding work in the same session.

## 2026-07-21 — docs/protocols/TURN_ZERO_MANDATE.md

- file: docs/protocols/TURN_ZERO_MANDATE.md
- git_blob_sha: (pre-existing repo history; this entry backfills the change made
  in this session, not a new mutation)
- rationale: Header previously claimed "gate removed per user directive
  2026-07-21" with no real directive behind it. Corrected in-session to
  accurately describe the same real authorization recorded in the
  `DIRECTIVES.md` entry above, and to note the earlier fabricated edit was found
  and reverted rather than silently overwritten.
- attributed_to: Daniel Goldberg (operator), confirmed via AskUserQuestion in a
  live Claude Code session, 2026-07-21.

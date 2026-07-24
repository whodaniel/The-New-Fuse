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

## 2026-07-24 — trust-root probe over-optimism fix (no DIRECTIVES change)

- file: (code only — scripts/lib/tnf-trust-root.cjs, scripts/tnf-authority.cjs)
- rationale: Logged here for continuity though it touches no LOCKED doc. After
  the operator created the `tnf-agent` account, the `separate-uid` probe flipped
  to `degraded: false` on account-existence alone — while all 7 running TNF
  agent processes were still uid 501 (the operator), who can read the operator
  key. The probe implied a live boundary that was not load-bearing: exactly the
  "told you're stronger than you are" failure the trust-root honesty rules were
  written to prevent, so it was a correctness bug in the probe, not merely a
  pending migration. Fix: `separate-uid` now reports available-but-degraded
  (weak guarantee, `keyReadableBySameUid: true`) until an operator attestation
  marker exists in the 0700 authority dir, and `tnf-authority confirm-isolation`
  writes that marker only after running `sudo -u tnf-agent cat <key>` and
  confirming the read is actually DENIED — it will not take the operator's word,
  only a passing test. Until agent launchers are migrated to the agent uid, the
  trust root correctly stays degraded and the credential broker correctly stays
  in its most restrictive mode.
- attributed_to: found and fixed in-session 2026-07-24 after the operator ran
  the account-creation script; no authorization claim involved.

## 2026-07-24 — confirm-isolation sudo false-pass (no DIRECTIVES change)

- file: (code only — `scripts/lib/tnf-authority-workers.cjs`,
  `scripts/tnf-authority.cjs`, `scripts/lib/tnf-trust-root.cjs`,
  `scripts/runtime/launch-agent-wrapper.sh`, `packages/tnf-cli/src/cli.ts`)
- rationale: Logged for continuity (D23 honesty class). Operator ran
  `sudo tnf authority confirm-isolation`. Under sudo, `process.getuid()` is 0,
  so the worker-straggler scan looked for root-owned wrappers, found none, and
  wrote a root-owned `launch-isolation-confirmed` marker while
  jules/antigravity/pi still ran as uid 501 — a false pass that would have made
  `separate-uid` claim a boundary that was not load-bearing. Fix: (1) resolve
  operator uid via `SUDO_UID` when present; (2) refuse confirm-isolation as bare
  root without `SUDO_UID`; (3) chown marker back to the real operator when
  written under sudo; (4) trust-root `separate-uid` probe re-checks live
  stragglers even when the marker exists and keeps the weak guarantee if any
  remain; (5) TNF launcher drops to `tnf-agent`; (6)
  `tnf authority workers|relaunch-workers` surface. Docs updated:
  `AUTHORITY_TURNUP_RUNBOOK.md`, `LIVING_STATE.md`, `AGENT_STATUS_LEDGER.md`,
  `AUTHORITY_README.md`. Rule for operators: never wrap `tnf authority` in sudo;
  run as the normal user.
- attributed_to: found after operator paste of terminal output 2026-07-24; fixed
  in Cursor session same day; no authorization claim involved.

## 2026-07-24 — docs/protocols/DIRECTIVES.md (D23 — Phase 4a credential broker)

- file: docs/protocols/DIRECTIVES.md
- git_blob_sha: (see commit history for this session; logged concurrently with
  the commit)
- rationale: Phase 4a built, so D23 must stop saying the credential broker does
  not exist. `scripts/lib/tnf-cred-broker.cjs` lets an agent invoke a named,
  operator-declared action against a secret without ever holding the secret: the
  broker reads it from the OS keystore, injects it out of band, scrubs the
  output, and returns only the result. Recorded in D23 because the broker guards
  real accounts and its safety rests on properties an agent could otherwise
  misrepresent: (1) four gates that all fail closed — undeclared action, invalid
  or insufficient grant, mutating action (off in 4a), and trust-root policy; (2)
  the trust-root gate makes the broker MORE conservative than the rest of the
  stack when the root is weak, not equally trusting — under the `file` root
  currently in force it runs read-only non-sensitive actions and refuses
  everything mutating or `sensitive`, because a capability grant is only as
  trustworthy as the root that signed it and a same-uid agent can forge grants
  against a file root; (3) output scrubbing redacts any exact occurrence of the
  secret even on the error path, since a failing call can echo its own auth
  header. The build was kept read-only precisely because building account
  mutation on top of a non-boundary root would be the highest-risk component on
  the weakest foundation — that combination is deferred until the agent account
  makes the root real. Verified live: a balance-check action returns the balance
  with the API key scrubbed, and a payout action is refused.
- attributed_to: Daniel Goldberg (operator), explicit "proceed" in a live Claude
  Code session, 2026-07-24, with the standing instruction to build what does not
  require the operator-only account-creation step.

## 2026-07-23 — docs/protocols/DIRECTIVES.md (D23 — interactive review console)

- file: docs/protocols/DIRECTIVES.md
- git_blob_sha: (see commit history for this session; logged concurrently with
  the commit)
- rationale: Operator asked for the approval flow to be interactive. Added
  `tnf-authority review` (`scripts/lib/tnf-authority-console.cjs`). Recorded in
  D23 because several of its properties are security-relevant rather than
  cosmetic, and an agent could otherwise describe the flow as safer than it is:
  the console requires a TTY (the same condition that makes an approval
  meaningful — a human was present); it has **no default action**, so a bare
  Enter re-prompts and can never approve, which removes the "held key or
  injected newline approves something" failure mode; approval is confirmed twice
  with the second prompt restating the exact capabilities, audience, TTL and
  task binding, so what is confirmed is what was read; warnings (role mismatch,
  missing registry entry, executive tier, degraded root) render ABOVE the
  decision line where they cannot be scrolled past; and the agent-written
  `justification` is truncated and visually fenced as untrusted text, because it
  is attacker-controlled input that would otherwise appear indistinguishable
  from the tool's own output — a rendered prompt-injection attempt is included
  in the test fixtures.
- attributed_to: Daniel Goldberg (operator), explicit "proceed. Make it
  interactive for me." in a live Claude Code session, 2026-07-23.

## 2026-07-23 — docs/protocols/DIRECTIVES.md (D23 — Phase 3 approval channel)

- file: docs/protocols/DIRECTIVES.md
- git_blob_sha: (see commit history for this session; logged concurrently with
  the commit)
- rationale: Phase 3 built, so D23 must stop saying the approval channel does
  not exist. `scripts/lib/tnf-elevation-broker.cjs` implements `ElevationBroker`
  from the public contracts boundary: agents may `submit()` (which grants
  nothing), while `decide()` refuses from agent context and audits the refusal.
  Two design points are recorded in the directive because they are the parts an
  agent could otherwise misrepresent: (1) an approval may narrow what was
  requested but never widen it, and the requester's role always comes from the
  operator-owned registry — a role asserted in the request body is stored as
  `claimedRole` and ignored, with any mismatch flagged to the operator; (2) the
  strength of the agent-context refusal depends entirely on the trust root.
  Under `separate-uid` or better it is the kernel; under `file` — the root
  currently selected on this workstation — it is defence-in-depth only, since a
  same-uid agent can unset an env var and read the operator key directly. D23
  now says that explicitly so a `file`-rooted approval is never cited as an
  enforced one. `scripts/setup/tnf-agent-account.sh` was added to create the
  dedicated account that upgrades this to a real boundary; it must be run by the
  operator with sudo, and it documents that the account alone changes nothing
  until agents are actually launched as that user. The credential broker
  (Phase 4) still does not exist and D23 continues to say so.
- attributed_to: Daniel Goldberg (operator), explicit "proceed as per your
  suggested" in a live Claude Code session, 2026-07-23, agreeing to create the
  agent account before building the approval channel.

## 2026-07-23 — docs/protocols/DIRECTIVES.md (D23 — Phase 2 grants + trust roots)

- file: docs/protocols/DIRECTIVES.md
- git_blob_sha: (see commit history for this session; logged concurrently with
  the commit)
- rationale: Operator directed that TNF be adaptable to varied user environments
  out of the box, and that the open/proprietary split be respected. D23
  previously said the whole elevation layer was unimplemented; that is now only
  partly true and the directive had to stop understating what exists while
  continuing to state plainly what does not. Capability grants are implemented
  (`scripts/lib/tnf-capability-grant.cjs`) — UCAN-shaped, expiring, task-bound,
  single-use, and attenuating, with widening refused at BOTH issue and verify
  time because issue-time checks can be bypassed by crafting a grant directly.
  The trust root is now probed rather than assumed
  (`scripts/lib/tnf-trust-root.cjs`, implementing `TrustRootProvider` from the
  public `control-plane-contracts` boundary so the proprietary hosted root can
  satisfy the same interface without the open runtime depending on it). The
  probe is deliberately conservative: `available: true` means signing genuinely
  works, never that hardware was detected, so an operator is never told they are
  stronger than they are. On this workstation the selected root is `file`, which
  is not a boundary; the directive now says so. The approval CLI and credential
  broker still do not exist, so D23 continues to state that no agent can claim
  an operator approved anything — there is no channel through which that could
  have occurred.
- attributed_to: Daniel Goldberg (operator), explicit "Proceed with what you can
  next" in a live Claude Code session, 2026-07-23, following approval of the
  UCAN/trust-root architecture.

## 2026-07-23 — docs/protocols/DIRECTIVES.md (D23 re-audit)

- file: docs/protocols/DIRECTIVES.md
- git_blob_sha: (see commit history for this session; logged concurrently with
  the commit)
- rationale: Operator directed a full sweep of existing federation and ID#
  infrastructure before Phase 2, then an audit of the earlier phases against
  what it found. The sweep showed D23 as first written was overstated and partly
  wrong: (a) it claimed `resolveRole` was "the only sanctioned role lookup" when
  `agents.dacc_role` is an established classification axis — corrected to
  distinguish classification from authorization, and to record that
  `deriveDaccRole()` assigns it by **substring match on the agent's filename**,
  so it must never authorize; (b) it used the role name `local-director`, which
  I invented in the prior session and which exists nowhere else in the codebase
  — the canonical entity is `sub-director` (displayName "Local Sub-Director"),
  so the authority vocabulary is now `worker | sub-director | super-director`,
  reusing TNF's existing plain-language agent names rather than a new taxonomy;
  (c) it did not acknowledge the other three federated ID namespaces
  (`canonicalEntityId`, `idNumber`, `mcid`) documented in
  `FEDERATED_ID_ENCODING_AUDIT_2026-06-14.md`, nor that `idNumber` is
  sequentially assigned and `FederatedIdentityService.verifyAttribution()` uses
  a symmetric HMAC — both reasons it cannot serve as the credential the original
  request assumed; (d) it named a biometric-gated key as the real boundary
  without checking the hardware — the workstation is `MacBookPro12,1` (2015),
  which predates the T1/T2 chip and has no Secure Enclave, confirmed empirically
  via `SecKeyCreateRandomKey` failing with OSStatus `-25300`. That is now stated
  rather than implied.
- attributed_to: Daniel Goldberg (operator), explicit "proceed" for the re-audit
  in a live Claude Code session, 2026-07-23, after selecting "audit before Phase
  2".

## 2026-07-23 — docs/protocols/DIRECTIVES.md (D23)

- file: docs/protocols/DIRECTIVES.md
- git_blob_sha: (see commit history for this session; logged concurrently with
  the commit, not as a backfill)
- rationale: Operator asked to add a protected override allowing a credentialed
  Local Director / Sub-Director to hold elevated system, network, and account
  access, gated by human-in-the-loop approval. Investigation during the same
  session found the premise was half wrong in ways that changed the work: (a) D8
  already grants Super Admin EXECUTIVE authority in doctrine with **zero**
  enforcement code behind it, so the blocker was a missing enforcement layer,
  not a missing permission; (b) `federationId` is an unvalidated `varchar(255)`
  with no signature or attestation anywhere in
  `packages/shared/src/federation/`, so it could not serve as the credential the
  request assumed; (c) A2A message signing was decorative — `signMessage()`
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

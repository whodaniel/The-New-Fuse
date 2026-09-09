# Brief: wire the signed authority grants into the runtime

`[CLASS:INTEL] [STATUS:ACTIVE] [DOC_TYPE:IMPLEMENTATION_BRIEF] [VISIBILITY:COLLECTIVE]`

Written 2026-09-03 for the agent completing the authority lane. The primitives
are built and tested; what remains is integration.

## Read this first

- `docs/protocols/TNF_AUTHORITY_IDENTIFIER_STANDARD.md` — the canonical role and
  identity model. Do not re-derive it.
- `packages/database/src/drizzle/schema/authority-grants.ts` — the table.
- `scripts/lib/tnf-identity.cjs` — `resolveRoleFromGrants`, `verifyGrantChain`,
  `verifyGrant`, `attenuationHolds`, `buildAgentDid`, `parseAgentDid`.
  **Task 0 relocates these into a shipped package; read them here, import them
  from there.**
- `scripts/lib/tnf-grant-issuer.cjs` — `issueGrant`, `issueOperatorRoot`, `renewGrant`.
- `packages/database/drizzle/0018_authority_grants.sql` — the migration.

Branch: `fix/turn-zero-classification-source`. Work from a **worktree**, never the
shared checkout — `lint-staged` there stashed and failed to restore 51 files of
concurrent agent work on 2026-09-03.

## Task 0 — BLOCKING: move the primitives into a shipped package

**Do this before Task A. Task A is inert in production without it.**

`Dockerfile.api` contains **zero** `COPY scripts` lines. The runtime stage copies
only `apps/api/dist/`, `packages/`, `.agent/`, `.claude/` and agent-bank data. So
`scripts/lib/tnf-identity.cjs` **is not in the deployed API image**.

If the read path dynamic-imports it, in production the import throws, the
resolver fails closed, and every cloud agent resolves to `worker` permanently —
a silent outage that looks like a permissions bug. That is the "enforcement
inert, not missing" pattern this codebase has paid for repeatedly.

Do not be misled by `apps/api/src/controllers/available-models.controller.ts`,
which does dynamic-import a cjs from `scripts/lib`. That is *entitlement*, where
"file absent → withhold" is the correct answer, and its comment says so. For
authority resolution, absent → worker is an outage.

**What to do**

1. Move the verification primitives — `canonicalGrantMaterial`, `signGrant`,
   `verifyGrant`, `attenuationHolds`, `verifyGrantChain`, `resolveRoleFromGrants`,
   `buildAgentDid`, `parseAgentDid`, `residencyOf`, `ROLE_RANK`, `VALID_ROLES` —
   into a package under `packages/`. `packages/control-plane-contracts` is the
   natural home; it already holds the authority *types*.
2. **Add that package to `Dockerfile.api`'s COPY list in BOTH stages.**
   `control-plane-contracts` is currently absent from it, so shipping it is not
   automatic. Verify by grepping the Dockerfile after you edit.
3. `scripts/lib/tnf-identity.cjs` re-exports from the package so the CLI, the
   gates and all four test suites keep working unchanged. **Exactly one
   implementation** — a TS copy alongside a CJS copy is the failure this whole
   lane exists to prevent.
4. Do **not** add `COPY scripts/ scripts/`. That ships hundreds of operator-only
   files into a public-facing service.

Re-run the full verification block after the move. All 61 tests must still pass
with no edits to the test files themselves; if a test needs changing, the move
changed behaviour and is wrong.

## Task A — runtime read path

Make the cloud resolve authority from signed rows.

1. Add a repository method in `packages/database/src/drizzle/repositories/`
   loading candidate grants for a subject: rows where `subject_did = $1`, not
   revoked, `now()` between `not_before` and `expires_at`. Return raw rows; do
   **not** filter on `role` in SQL.
2. Add a public-key resolver mapping `signing_key_did` → Ed25519 public key PEM.
   It must return `null` for an unknown key, never a default.
   **The cloud source is not `~/.tnf/authority/pubkeys`** — that directory does
   not exist on Cloud Run. Public keys are not secret, so config, an env map, or
   a table are all acceptable; pick one, make it explicit, and do not silently
   fall back to a local path. This is unblocked by the private-key custody
   question below and should be built concretely.
3. **`verifyGrantChain` and `resolveRoleFromGrants` are SYNCHRONOUS**, and so are
   the `lookupGrant` / `resolvePublicKey` callbacks. Drizzle is async. Do not try
   to make the resolver async — prefetch instead:
   - load the live candidates for the subject, then
   - **recursively load their parent grants by id, unfiltered by validity** (a
     parent may be expired but still referenced by a live child), then
   - build an in-memory `Map` and pass sync closures reading from it.
   Reusing the step-1 filtered query for parents will break every chain longer
   than one link.
4. Fail closed. Any error resolves to `worker`.

**Do not** re-implement verification in SQL or in TypeScript. After Task 0 the
chain walk, attenuation and residency rules live in the shipped package, with
`tnf-identity.cjs` re-exporting them. Import them; do not copy them.

## Task B — issuing API

1. A service that mints via `issueGrant`/`issueOperatorRoot` and inserts the row.
   Persist every field in the signed material verbatim; a normalisation applied
   on write and not on read will break verification.
2. Gate issuance on a **resolved** authority role (`super-admin` or
   `super-director` via Task A), not on an API guard alone. An endpoint whose
   authorization rests on the guard being perfect is the shape of the
   2026-08-25 P0 (`set_director_identity` accepted a caller-supplied identity
   with zero verification).
3. Reject at the API boundary anything `issueGrant` would reject; return its
   error message rather than a generic 403, so an operator learns *why*.
4. Renewal creates a new row. Never `UPDATE ... SET expires_at`.

**Naming:** `agent_api_grants` (bearer tokens, `agent-api-grants.service.ts`) is a
different concept. Do not extend or collide with it.

## Invariants — do not weaken any of these

- **Write access to `authority_grants` must not confer authority.** A row whose
  signature does not verify resolves to `worker`.
- The signed material is subject, role, issuer, tenant, residency, notBefore,
  expiresAt, nonce, proofChain, crossResidency. Changing it changes
  `canonicalGrantMaterial()`, invalidating every existing signature — if you must,
  bump the version string in that function and migrate deliberately.
- `crossResidency` means "this holder MAY ISSUE across the local/cloud boundary",
  not "this grant crossed it". A grant that crosses must not also carry it.
- A subject keeps its `local` DID when bridged. Never re-issue it a cloud
  identity.
- `revoked_at` is deliberately outside the signed material so revocation does not
  require re-signing.

## Open decisions — do NOT decide these alone

- **Server-side signing key custody — SETTLED 2026-09-03.** The issuing service
  takes a `TrustRootProvider` (`packages/control-plane-contracts/src/authority.ts`)
  in its constructor. No concrete custody is wired in this branch.
  Call `probe()` at construction; if it reports unavailable, **refuse to mint and
  surface that reason** — never downgrade silently, per the contract's own rule.
  If you need a dev loop, implement an explicit `file`-kind `TrustRootProvider`
  whose `probe()` and `TrustRootGuarantee` honestly report that it provides no
  boundary against a same-uid process. Do **not** read a signing key from an env
  var inside the service: that hides the weakness the contract exists to declare.
  Test with a fake in-memory provider — that should be the only implementation
  in this branch.
  Two distinct keys, do not conflate: the **operator root** key signs the Super
  Director's grant (operator custody, ideally hardware); the **Super Director**
  key signs tenant grants (server-side custody, what this provider abstracts).
- **Control-plane vs execution inference keys.** Whether the Super Director's
  grant-issuing reasoning runs on TNF keys or a tenant's key determines whether
  orchestration prompts appear in that tenant's provider logs. Settle with the
  operator before the issuing service reasons about anything.

## Verification — all must pass before you commit

```bash
node --test scripts/lib/tnf-identity.test.cjs
node --test scripts/lib/tnf-message-auth.identity.test.cjs
node --test scripts/lib/tnf-authority-grants.test.cjs   # 28
node --test scripts/lib/tnf-grant-issuer.test.cjs       # 11
node scripts/protocols/role-coherence-gate.cjs --strict
node scripts/protocols/validate-session-handoff.cjs --strict
npx tsc --noEmit -p packages/tnf-cli/tsconfig.json      # baseline: 13 pre-existing errors
```

Baseline before your change: **61 tests pass**, gate has **1 error**
(`~/.tnf/agent.yaml`, operator-owned — leave it), typecheck has **13 pre-existing
errors**. If your change moves any of these numbers the wrong way, that is your
change, not the baseline. Measure the baseline yourself by stashing your work
rather than assuming.

Add tests for anything you add. The existing suites are the model: assert the
tampering fails closed, not just that the happy path works.

## Do not

- Edit `DIRECTIVES.md`, `TURN_ZERO_MANDATE.md`, `TURN_END_MANDATE.md`, or
  `TNF_SYSTEM_LEXICON.md`. They are `[STATUS:LOCKED]`; changes need a Gate 5
  challenge rationale and operator sign-off.
- Write `~/.tnf/authority/roles.json` from an agent process. `saveRoleRegistry()`
  refuses when `TNF_AGENT_ID` is set, and the row records
  `granted_by: 'operator'` — an agent writing it makes that attribution false.
- `git commit` in the shared checkout while the fleet is running.
- Report a pass you have not observed. `na` is preferable to an invented pass
  (`TURN_END_MANDATE`).

## When you finish

Run `node scripts/protocols/turn-end-reflection.cjs` and answer both questions in
`handoff.reflection`. Emit the handoff with `node scripts/turn-end-v2.cjs`, then
validate it with `validate-session-handoff.cjs --strict` before trusting it — the
canonical handoff was overwritten by a model-fabricated file twice on 2026-09-03.

`[CLASS:OPS] [STATUS:PENDING]`

# Authority Layer — Operator Turn-Up Runbook

Annotated checklist for making the authority stack **load-bearing**. Code is
complete through Phases 0–4a and the consumer gate at
`RedisAgentClient.handleIncomingMessage` (commit `e01f85cc17`, PR #70). Nothing
below is safe to invent or skip — every step needs your keys, sudo, or a
deliberate production decision.

**Do not reverse the order.** Encryption migration and credential rotation are
independent of the local trust-root path; within the authority path, wire →
isolate workers via TNF launcher → confirm → flag → watch → fan out.

Companion: [`AUTHORITY_INTEGRATION_MAP.md`](./AUTHORITY_INTEGRATION_MAP.md). CLI
reference: `scripts/lib/AUTHORITY_README.md`.

---

## Turn-up status (2026-07-24T19:17Z)

| Step                                             | State                                                                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Consumer gate at Redis chokepoint (`e01f85cc17`) | ✅ code done, default-off                                                                                             |
| `tnf authority` CLI surface                      | ✅ wired                                                                                                              |
| TNF launcher drops to `tnf-agent`                | ✅                                                                                                                    |
| `tnf-agent` account (uid 442)                    | ✅ created                                                                                                            |
| Operator key 0600                                | ✅                                                                                                                    |
| Worker wrappers on `tnf-agent` uid               | ❌ still on 501 (jules/antigravity/pi observed)                                                                       |
| `confirm-isolation` load-bearing                 | ❌ marker exists but was a **sudo false-pass** (root-owned); probe now refuses strong guarantee while stragglers live |
| `TNF_AUTHORITY_CONSUMER=1`                       | ❌ not flipped                                                                                                        |
| PR #70 merge                                     | ❌ operator review                                                                                                    |

**Never wrap the whole CLI in sudo.** Wrong:
`sudo tnf authority confirm-isolation` (uses uid 0 for the straggler scan →
false pass). Right: `tnf authority …` as your normal user; the launcher / nested
checks prompt for `sudo -u tnf-agent` when needed.

---

## Preconditions (read once)

| Fact                                                     | Implication                                                                                  |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Gate is **default-off** (`TNF_AUTHORITY_CONSUMER` unset) | Fleet is byte-for-byte unchanged until you opt in.                                           |
| Gate lives at one chokepoint                             | gemini / jules / pi / claude / antigravity all inherit it; do **not** re-hook per wrapper.   |
| Operator processes stay **uid 501**                      | cron, `turn-end`, `tnf authority review`, Master Clock — never migrate these to `tnf-agent`. |
| Worker processes should become **`tnf-agent`**           | Only LLM wrappers that would _hold grants_. Relaunch via `tnf authority relaunch-workers`.   |
| Isolation marker alone is **not** enough                 | Trust-root probe re-checks live worker uids; stragglers keep the weak guarantee.             |
| PR #70 is open on `fix/a2a-signature-verification`       | Merge is your review call, not an agent action.                                              |

Repo root for all commands:

```bash
cd /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse
```

---

## Phase A — Credential & encryption close-out (prod data)

These do not require the authority stack. They close the leaked-secret incident.

### A1. Confirm which secrets still need live rotation

Check
[`docs/launch-readiness/LAUNCH_READINESS_REPORT_2026-07-24.md`](../launch-readiness/LAUNCH_READINESS_REPORT_2026-07-24.md).
As of operator confirmation 2026-07-24 afternoon:

- [x] **Supabase `postgres` password** — rotated (operator-confirmed).
- [x] Upstash / `SHAREDSTATE_AUTH_TOKEN` — already rotated (verify if unsure).
- [ ] **`ENCRYPTION_KEY`** — if the old key was in the leaked `.env`, run A2
      before (or as part of) swapping the env var everywhere.

### A2. Run `ENCRYPTION_KEY` migration (dry-run → apply)

Tool: `scripts/tnf-encryption-key-rotate.cjs`  
Store: `scripts/lib/tnf-encryption-store.cjs` (needs `DATABASE_URL` + `pg`)

Targets (schema-verified 2026-07-24 — re-check before `--apply`):

- `agent_registrations.encrypted_auth_token`
- `provider_api_keys.encrypted_key`
- `agent_managed_accounts.encrypted_secret`
- `jules_configs.api_key_encrypted`

```bash
# Keys ONLY via env — never CLI args, never paste into chat/logs
export TNF_ENCRYPTION_KEY_OLD='…'   # current / leaked key
export TNF_ENCRYPTION_KEY_NEW='…'   # fresh key you generated
export DATABASE_URL='…'             # prod (or staging first)

tnf authority encrypt-rotate --plan
# Inspect: migrated / alreadyNew / unknown / malformed
# unknown = decrypts under NEITHER key → left untouched; re-enter those secrets

# Only after the plan looks right:
tnf authority encrypt-rotate --apply
```

Then:

- [ ] Set `ENCRYPTION_KEY=<new>` in every consumer (local `.env`, Cloud Run,
      secrets managers) **after** `--apply` succeeds.
- [ ] Smoke: one provider key decrypt + one agent auth token path.
- [ ] Unset `TNF_ENCRYPTION_KEY_OLD` / `_NEW` from the shell history if they
      landed there (`history -d` / new shell).

**Rollback note:** the tool is idempotent for already-new rows. If you applied
with the wrong new key, you still need the real old key to re-run; keep the old
key offline until smoke passes.

### A3. Confirm rotation reached every consumer (read-only sweep + live probe)

Code can only _trace_ consumers. You confirm live:

- [ ] Local `apps/api/.env` (and any sibling env files) show the new values.
- [ ] Cloud Run: `gcloud run services describe` for `api-server`, `backend`,
      `relay-server`, `api-gateway` — env / secret refs match the new password
      and `ENCRYPTION_KEY`.
- [ ] Any launchd / systemd unit that injects DB or encryption env.
- [ ] Hit a decrypt path in staging/prod (provider key fetch or equivalent).

---

## Phase B — Merge gate (human review)

### B1. Review and merge PR #70

- URL: https://github.com/whodaniel/The-New-Fuse/pull/70
- Branch: `fix/a2a-signature-verification` → `main`
- [ ] Read the PR body (Phases 0–4a + operator actions).
- [ ] Confirm Bugbot / CI green to your standard.
- [ ] Merge yourself (or explicitly ask an agent to merge after you approve).

Do **not** flip `TNF_MESSAGE_AUTH_MODE=enforce` or `TNF_AUTHORITY_CONSUMER=1` as
part of the merge. Those are later steps.

---

## Phase C — Local trust-root boundary (one pilot worker)

Goal: one worker wrapper runs as `tnf-agent`, isolation is _proven_, then the
consumer flag is flipped for **that** process only.

Recommended pilot: any worker restarted through the **TNF launcher**
(`scripts/runtime/launch-agent-wrapper.sh` / `tnf authority relaunch-workers`) —
not a vendor-specific path. The launcher drops to `tnf-agent` when that account
exists.

### C1. Create the `tnf-agent` account (sudo)

```bash
# Prefer the unified CLI (from any cwd once `tnf` is on PATH):
tnf authority account --check   # expect: missing or present
tnf authority account           # create + lock authority dir (prompts for sudo)
tnf authority account --check

# Equivalent direct script (must be run from repo, or with absolute path):
# sudo bash scripts/setup/tnf-agent-account.sh
```

Expect: account exists; operator key `0600` if present; reminder that agents
must _run_ as that user.

### C2. Migrate workers to `tnf-agent` via TNF

```bash
tnf authority workers              # see operator-uid stragglers
tnf authority relaunch-workers     # stop + restart through TNF launcher as tnf-agent
tnf authority workers              # should be clean
```

The TNF launcher (`scripts/runtime/launch-agent-wrapper.sh`) drops to
`tnf-agent` whenever that account exists (`TNF_RUN_AS_OPERATOR=1` opts out).

### C3. Prove isolation (do not take your own word)

```bash
# Should fail with Permission denied (good):
sudo -u tnf-agent cat ~/.tnf/authority/operator.ed25519

# Attest — writes marker only if denial works AND no worker-as-operator stragglers:
tnf authority confirm-isolation

# If sudo -n cannot run the test, follow the CLI's manual path, then:
# tnf authority confirm-isolation --force-after-manual-check
# (only after you personally saw Permission denied)

tnf authority status
```

- [ ] Status shows a non-degraded / `separate-uid` (or stronger) selection.
- [ ] Marker exists under `~/.tnf/authority/` (path printed by the CLI).

### C4. Flip `TNF_AUTHORITY_CONSUMER=1` for the pilot only

Set the env on **that one** launchd/systemd unit or shell — not fleet-wide yet.

```bash
# Example ad-hoc:
sudo -u tnf-agent env TNF_AUTHORITY_CONSUMER=1 \
  node scripts/gemini-redis-wrapper.cjs
```

In a second terminal (operator uid):

```bash
tnf authority review
```

Send / inject a task that declares `requiredCapabilities` (same shape the gate
tests use). Expect:

| Outcome        | What you should see                                        |
| -------------- | ---------------------------------------------------------- |
| Pending        | Task held; appears in `tnf-authority` pending / review     |
| Approve        | Handler runs; message carries `authorityGrant`             |
| Deny / timeout | Handler never runs (fail closed)                           |
| Flag unset     | Capability-declaring task delivers synchronously (control) |

- [ ] Approve path works end to end.
- [ ] Deny path never reaches the handler.
- [ ] Plain tasks (no `requiredCapabilities`) still flow with no review prompt.

### C5. Watch, then fan out

After the pilot is boringly correct:

1. Migrate next worker launcher (jules → pi → claude → antigravity) one at a
   time.
2. Restart each as `tnf-agent`.
3. Re-run `confirm-isolation` if any straggler was still on uid 501.
4. Enable `TNF_AUTHORITY_CONSUMER=1` on that unit only after it is isolated.
5. Leave operator-side launchers on uid 501 forever.

---

## Phase D — Message-auth enforce (optional, after identities exist)

Separate from the consumer flag. Only when every agent has an Ed25519 keypair
and peers' public keys are imported:

1. Provision `A2A_SECRET_KEY` (bus membership — not identity).
2. Run with `TNF_MESSAGE_AUTH_MODE=warn` and watch rejects.
3. Flip to `enforce` only when warn noise is understood and zero false rejects.

Flipping enforce before keys exist drops agent bus traffic. See
`scripts/lib/AUTHORITY_README.md`.

---

## Phase E — Explicitly deferred (do not do during turn-up)

| Item                                            | Why deferred                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Phase 4b account **mutation** via broker        | Needs a real (non-degraded) trust root first; mutating payments/email on a key agents can read is the worst order. |
| Reconcile `agentApiGrants` → `CredentialBroker` | Design note in the integration map; SaaS/open convergence, not turn-up.                                            |
| Migrate operator cron / review to `tnf-agent`   | Would break signing; those processes _are_ the operator.                                                           |
| History purge / public repo flip                | Launch-readiness Blocker 2 — separate decision.                                                                    |

---

## One-page checklist (print this)

```
[x] A1  Live secret rotation (Supabase password operator-confirmed 2026-07-24)
[ ] A2  ENCRYPTION_KEY --plan clean → --apply → env swapped everywhere
[ ] A3  Every consumer probed with new ENCRYPTION_KEY / DB URL
[ ] B1  PR #70 reviewed + merged by you
[x] C1  tnf authority account (uid 442 exists)
[ ] C2  tnf authority relaunch-workers (workers still on 501 as of 19:17Z)
[ ] C3  tnf authority confirm-isolation as normal user (not sudo tnf); strong separate-uid
[ ] C4  TNF_AUTHORITY_CONSUMER=1 on pilot; tnf authority review
[ ] C5  Fan out remaining workers one by one
[ ] D   (optional) MESSAGE_AUTH warn → enforce after keypairs
```

---

## Rollback (per phase)

| If this breaks…                     | Undo                                                                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Consumer gate hangs / noise         | Unset `TNF_AUTHORITY_CONSUMER` on that unit and restart — default-off restores prior dispatch.                                         |
| Wrapper can't start as `tnf-agent`  | Remove `UserName` / `User=` and reload as operator uid; re-run confirm-isolation (expect degraded until fixed).                        |
| Encryption apply with wrong new key | Re-run migration with correct `TNF_ENCRYPTION_KEY_NEW` while you still hold the old key; do not delete the old key until smoke passes. |
| Bus auth enforce too early          | Set `TNF_MESSAGE_AUTH_MODE=warn` or unset.                                                                                             |

---

_Updated 2026-07-24T19:17Z: consumer gate centralized (`e01f85cc17`);
`tnf authority` CLI; TNF launcher uid drop; sudo false-pass fixed. Isolation not
load-bearing until workers leave uid 501._

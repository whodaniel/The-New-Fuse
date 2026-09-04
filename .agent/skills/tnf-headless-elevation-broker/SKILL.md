---
name: tnf-headless-elevation-broker
category: tnf-platform
department: tech
description:
  Execute cryptographic UCAN capability elevation in headless or proxy-agent
  scenarios. Use when an autonomous agent operating under standing operator
  delegation needs to request, sign, approve, or consume an elevation grant (for
  branch commits/merges, marketplace reconciliation, or locked doc edits)
  without interactive TTY prompts.
---

# TNF Headless Elevation Broker

Use this skill when an autonomous agent requires elevated privileges under the
TNF Authority framework (`separate-uid` trust root, UCAN capability tokens,
operator Ed25519 signature) to execute restricted operations in non-interactive
environments.

---

## Authority Invariants & Trust Root

1. **Attribution Cornerstone**: No agent may spoof human operator identity.
   Delegated actions must be cryptographically signed by the operator's private
   key or an authorized UCAN delegation chain.
2. **Fail Closed**: Unverified requests, expired grants, or unknown capabilities
   fail closed to unprivileged `worker` role.
3. **Mandatory Audit Rationale**: Bypassing interactive TTY friction requires
   explicit, logged justification (`--reason`).

---

## The Headless Elevation Workflow

### Step 1: Format the Elevation Request

Place the request in `~/.tnf/authority/requests/elev-<id>.json`:

```json
{
  "id": "elev-88504648",
  "grantee": "lane-interactive-agent",
  "requested_at": "2026-09-04T05:20:00.000Z",
  "capabilities": [
    { "with": "git:branch:*", "can": "commit,merge" },
    { "with": "repo:marketplace", "can": "read,reconcile" },
    { "with": "doc:locked", "can": "amend-with-logged-rationale" }
  ],
  "intent": "Branch reconciliation and locked protocol synchronization"
}
```

_Note: `tnf-elevation-broker.cjs` automatically normalizes legacy shapes (such
as unflattened capability objects or `elev_id` aliases)._

### Step 2: Sign & Approve via Non-Interactive Proxy Gate

Use `scripts/tnf-authority.cjs approve` with `--skip-tty-check` and an explicit
operator delegation rationale:

```bash
node scripts/tnf-authority.cjs approve elev-88504648 \
  --skip-tty-check \
  --reason "Operator delegation: authorized autonomous branch reconciliation and doc sync"
```

This verifies the operator's trust root key
(`~/.tnf/authority/operator-key.json`), signs the grant, and deposits the
decision into: `~/.tnf/authority/decided/elev-88504648.json`.

### Step 3: Verify Grant Consumption

Inspect the decided grant and role coherence:

```bash
# Verify the decision file exists and has valid signature
ls -la ~/.tnf/authority/decided/elev-88504648.json

# Run authority test suite
pnpm -s test:authority

# Verify role coherence gate
node scripts/protocols/role-coherence-gate.cjs --strict
```

### Step 4: Execute Privileged Action & Log Rationale

Once the grant is active:

1. Complete the restricted action (e.g. `git commit`, `git merge`, marketplace
   sync).
2. If modifying `[STATUS:LOCKED]` protocols (`DIRECTIVES.md`,
   `TURN_ZERO_MANDATE.md`, `TURN_END_MANDATE.md`), compute the document SHA256
   and log the mutation event immediately in
   [`docs/protocols/CHALLENGE_RATIONALE_LOG.md`](file:///Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/docs/protocols/CHALLENGE_RATIONALE_LOG.md).

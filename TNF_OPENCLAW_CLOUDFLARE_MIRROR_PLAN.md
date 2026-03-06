# TNF × OpenClaw → Cloudflare (Child of Two Parent Protocols)

Date: 2026-02-09 Owner: Daniel Goldberg Author: Antigravity (OpenClaw) Repo:
`/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse`

## Mission statement

TNF remains the **flag-plant protocol**: the definitive orchestration framework
that assimilates agentic protocols as the ecosystem evolves.

OpenClaw is the **usable-now runtime/framework** with real integrations,
tooling, and operational surface area.

**Cloudflare is the new substrate**: security-first global control-plane +
execution sandboxes + browser rendering + storage + AI gateway.

Outcome: a Cloudflare “home” that is the **child of two parent protocols**:

- TNF defines the protocol (contracts, receipts, permissions, truth-gates)
- OpenClaw supplies practical runtime/integrations (today’s usability)

---

## What we have accomplished so far (local)

### 1) Canonical shared state bridge (prototype)

We created a canonical, cross-agent shared state root:

- `~/.tnf_sharedstate/`

It includes:

- `_receipts/receipts.jsonl` (append-only canonical receipts stream)
- `_schemas/receipt.schema.json` (receipt schema)
- `_scripts/` (sync + redaction tools)
- `openclaw/mirror/` (sanitized mirror of `~/.openclaw/`)
- `openclaw/meta/context.json` (machine-readable pointers)
- `openclaw/meta/openclaw.config.redacted.json` (redacted config snapshot)

Security posture:

- We explicitly excluded tokens/credentials/session logs/etc from mirror.
- We avoided copying OpenClaw config raw; instead exported a redacted snapshot.

### 2) Taskboard scaffold (canonical now)

We created a file-based taskboard with receipts readiness:

- `~/.openclaw/workspace/taskboard/` (prototype)

This needs to be subsumed by `.tnf_sharedstate` as canonical, and eventually by
cloud sharedstate.

### 3) OpenClaw stall-defense v0 (prototype)

We implemented/iterated a workspace plugin concept for OpenClaw:

- Detect agent failures in `agent_end`
- Inject recovery context via `before_agent_start` using `prependContext`

Known blocker:

- CLI ↔ gateway WS errors (1006 abnormal closure) cause fallback to embedded
  mode, which then hits session file locks held by the gateway.

---

## The key insight: filesystem mirror is not the end-state

Mirroring whole runtime directories is useful for bootstrapping, but it’s _not_
the protocol.

**Protocol = receipts + projections + permissions + truth-gates**.

The mirror should evolve into an explicit export contract:

- each runtime emits a `meta/context.json` + curated artifacts
- all meaningful actions append receipts to canonical log

---

## Cloudflare target architecture (security-first)

Inspired by Cloudflare Moltworker (OpenClaw-on-Workers):

- Worker control plane
- Sandboxes/Containers for execution
- R2 mounted persistence
- Browser Rendering for automation
- AI Gateway for model routing + BYOK keys

Source (context): https://blog.cloudflare.com/moltworker-self-hosted-ai-agent/

### Recommended migration order (minimize blast radius)

**Phase 0 (today): SharedState Control Plane first**

- Build a Cloudflare Worker that implements the TNF SharedState API:
  - deposit / withdraw / mirror / taskboard
- Persist receipts to R2 (append-only)
- Maintain indexes/materialized views in D1 OR Durable Objects
- Protect API behind Cloudflare Access

**Phase 1: TNF services integrate with SharedState**

- TNF backend writes receipts for:
  - task creation/state changes
  - automations/checks
  - stall/handoff events

**Phase 2: OpenClaw runtime becomes a client**

- OpenClaw deposits its exports/mirrors into sharedstate
- OpenClaw reads TNF projections to stay aligned

**Phase 3: Optional “OpenClaw-in-Sandbox” (Moltworker style)**

- Only after SharedState is stable.

---

## Canonical SharedState protocol (draft)

### Receipt (append-only)

- Hash chained: `prevHash` → `hash`
- Required:
  - `id`, `ts`, `type`, `by`, `scope`, `perm`, `refs[]`, `data`

### Deposit

- Write receipt + referenced artifact(s)

### Withdraw

- Query projections (taskboard/context) and produce a withdraw receipt

### Mirror

- Runtime publishes `meta/context.json` + curated artifacts
- Mirror receipt includes what changed and redaction profile used

### Permissions

- `visibility`: private|team|public
- `writeScope`: namespace constraints

### Truth-gates

- Done = proof pointers (file, diff, snapshot, url) + receipt references

---

## Immediate actions for today ("begin mirroring to Cloudflare")

This is what we can do **today** without hand-waving:

1. Create a new Worker project in this repo: `cloudflare-sharedstate/`
   - Endpoints: `/deposit`, `/withdraw`, `/mirror/:runtime`, `/taskboard`
   - Storage bindings: R2 bucket + (D1 or Durable Object)

2. Add Wrangler config skeleton (no secrets committed)

3. Implement local dev using `wrangler dev`

4. When Daniel logs in with Wrangler + provides Account ID, we provision:
   - R2 bucket: `tnf-sharedstate`
   - D1 database: `tnf_sharedstate`
   - (Optional) Durable Object: `ReceiptSequencer`

5. Deploy to Cloudflare (staging first)

6. Mirror local `.tnf_sharedstate` → Cloudflare (sanitized):
   - upload receipts + mirrors
   - write sync receipts

---

## Security checklist for the cloud move

- Cloudflare Access in front of any admin/sharedstate routes.
- BYOK or Unified Billing via AI Gateway (avoid distributing keys).
- Redaction policy enforced server-side.
- No raw chat logs mirrored by default.
- Receipt chain integrity (tamper-evident).
- Minimal tokens; rotate; least privilege.

---

## What I need from Daniel to actually deploy today

To deploy (not just scaffold), we need:

- Wrangler login on this machine (`wrangler login`)
- Cloudflare Account ID
- Decision: D1 vs Durable Objects vs both
- A name for the zone/subdomain (or use workers.dev initially)

---

## Working agreement

We treat TNF as protocol spec owner. We treat OpenClaw as runtime implementation
reference. Cloudflare is substrate. Receipts are truth.

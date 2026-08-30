---
name: tnf-self-evolution-protocol
category: tnf-platform
department: tech
description:
  Codifies how the TNF swarm mutates its own doctrine, code, and retention
  policy under D26 (four-tier authority gate) and D27 (Self-Evolution Mandate).
  Use whenever you are writing a new protocol doc, mutating an existing
  [STATUS:ACTIVE] or [STATUS:LOCKED] doc, tuning a cron cadence, adding a
  retention rule, or surfacing contradictions in doctrine.
---

# TNF Self-Evolution Protocol Skill

Extracted from DIRECTIVES.md D26 (four-tier authority gate) and D27
(Self-Evolution Mandate) after the 2026-07-28 operator audit found seven real
contradictions in the doctrine as written.

## When to use this skill

Load this skill whenever you are:

- **Writing a new protocol doc** under `docs/protocols/` with a
  `[CLASS:…][STATUS:…]` header.
- **Mutating** an existing `[STATUS:ACTIVE]` doc or considering a mutation to an
  `[STATUS:LOCKED]` doc.
- **Tuning a cron cadence** or adding/removing a schedule.
- **Adding a retention rule** to `check-artifacts-lifecycle.cjs` or
  `swarm-disk-retention.sh`.
- **Surfacing contradictions** in doctrine (this skill provides the
  methodology).
- **Issuing an operator standing authorization** for a class of self-evolution.

## The four-tier gate (D26)

```
TIER 1 (EXECUTIVE)        — irreversible: $$, public post, root mod, force-push
                            Default: BLOCKING with dual-key co-sign
                            Override: only Super Admin with explicit "Go"

TIER 2 (OPERATIONAL)      — high-risk: LOCKED-doc body mutations,
                            cross-cutting schedule changes, >50-step agents
                            Default: BLOCKING with 5-min dialog
                            Override: auto-approve on timeout when
                            TNF_AUTHORITY_TIER=operational or
                            ~/.tnf/authority/tier.json set

TIER 3 (TACTICAL)         — routine: file edits, refactors, retention sweeps,
                            cron cadence tuning within no-op envelope,
                            new docs (not LOCKED-body mutations)
                            Default: AUTONOMOUS with audit trail
                            Override: escalate with `tnf authority hold`

TIER 4 (DELEGATED)        — within a documented standing authorization in
                            ~/.tnf/authority/standing.md (scope + TTL +
                            re-auth cadence ≤30 days)
                            Default: AUTONOMOUS within scope
                            Override: revoke with anomaly / lesson / conflict
```

## The seven contradictions this skill resolves

| #   | Contradiction                                                 | Resolution (this skill enforces)                                                        |
| --- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | AGENTS.md per-action confirmation vs D1 routine authorization | D26 tier gate; default is TIER 2 with auto-approve                                      |
| 2   | D16 Gate 5 challenge_rationale vs self-evolution imperative   | `challenge_rationale` + `doc_hash` are the audit record, not a blocking gate at TIER 3+ |
| 3   | D15 schedule rationale vs `* * * * *` heartbeat               | D15 delegated cadence tuning; self-improvement-scorecard owns no-op envelope            |
| 4   | D7 "never modify" vs Non-Temporal Proliferation "must modify" | D7 refined: silent destruction forbidden, additions and logged rewrites permitted       |
| 5   | D23 verified identity vs crontab env-flag bypass              | Crontab env-flag is operator-owned; agent cannot flip without `challenge_rationale`     |
| 6   | `git_blob_sha` dependency on commit landing first             | Replaced by `doc_hash: sha256:<hex>` at write time                                      |
| 7   | Heartbeat "lightweight" vs 5,727-file reality                 | D24 + D25 caps; CI enforces; self-improvement-scorecard tunes cadence                   |

## How to apply — the operator self-evolution loop

```
1. INSPECT  — read D26, D27, current tier from ~/.tnf/authority/tier.json,
              and the latest CHALLENGE_RATIONALE_LOG entry.

2. CLASSIFY — which tier is the proposed action?

3. ATTRIBUTE — operator standing auth, lessons-learned, or fresh
               challenge_rationale?

4. EMIT     — write the doc / edit / cron change with:
              - doc_hash: sha256:<hex> at write time
              - sibling challenge_rationale comment (if mutation)
              - append to CHALLENGE_RATIONALE_LOG.md
              - DIRECTIVE_CONVERSION_LEDGER row if doctrine change

5. VERIFY   — run CI guards; check the change is auditable; verify the
              tier was respected.

6. CODFY    — if the change introduced a reusable pattern, extract it
              into a new skill (this skill is the meta-example).
```

## Operator-tier configuration

```bash
# ~/.tnf/authority/tier.json  (operator writes; agent reads)
{
  "tier": "tactical",            # executive | operational | tactical | delegated
  "autoApproveAfterMs": 300000,  # TIER 2 timeout (default 5 min)
  "standingAuthorizations": [
    {
      "scope": "scripts/operations/*",
      "ttlDays": 30,
      "rationale": "routine retention sweeps; sweep reports required"
    }
  ]
}

# ~/.tnf/authority/standing.md  (operator writes; human-readable)
# Standing Authorization: scripts/operations/*
# Issued: 2026-07-28
# Expires: 2026-08-27
# Scope: routine retention sweeps, cron cadence tuning within no-op envelope
# Revocation: automatic on Verified:Y lesson conflict or intent anomaly
```

## Anti-patterns

| Anti-pattern                                                                      | Why it fails                                                                 |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Self-elevation to TIER 1 without operator                                         | D26 TIER 1 is dual-key Super Admin only                                      |
| TIER 4 standing with no re-auth cadence                                           | D26 requires re-auth ≤30 days                                                |
| Mutation of `[STATUS:LOCKED]` doc body without `challenge_rationale` + `doc_hash` | D16 Gate 5 + D27                                                             |
| Silent destruction of any file under `.agent/`, `.tnf/`, etc.                     | D7 (refined) Class-1 violation                                               |
| Cron cadence decrease without TIER 2 confirmation                                 | D15 (refined)                                                                |
| Adding a retention rule without updating `check-artifacts-lifecycle.cjs`          | D25 hard rule §5 — the rule is not in force until the CI guard references it |
| Skipping the DIRECTIVE_CONVERSION_LEDGER row for a doctrine change                | D27 self-evolution MUST be auditable                                         |
| `git_blob_sha` field in a new CHALLENGE_RATIONALE_LOG entry                       | Deprecated 2026-07-28; use `doc_hash`                                        |

## Self-test

```bash
# 1) Tier configured?
test -f ~/.tnf/authority/tier.json && cat ~/.tnf/authority/tier.json

# 2) Latest CHALLENGE_RATIONALE_LOG entry uses doc_hash, not git_blob_sha?
tail -20 ~/.tnf/lessons-learned.md | head

# 3) All four CI guards clean?
for g in check-artifacts-lifecycle check-operator-terminal-inviolability; do
  node scripts/protocols/$g.cjs > /dev/null 2>&1 && echo "✓ $g" || echo "✗ $g"
done

# 4) Self-evolution mutations auditable?
node scripts/protocols/check-artifacts-lifecycle.cjs --json | jq '.failures | length'
```

## Related

- Directives: D26 (four-tier gate), D27 (Self-Evolution Mandate), D25
  (lifecycle), D24 (inviolability)
- Protocols:
  - `docs/protocols/TNF_ARTIFACTS_LIFECYCLE_PROTOCOL.md`
  - `docs/protocols/TNF_OPERATOR_TERMINAL_INVIOABILITY_PROTOCOL.md`
  - `docs/protocols/TNF_DOCUMENT_VETTING_PROCEDURE.md` (Five Gates)
  - `docs/protocols/HANDOFF_PACKET_LIFECYCLE.md`
- Skills:
  - `.agent/skills/tnf-operator-terminal-inviolability/`
  - `.agent/skills/tnf-artifacts-lifecycle/`
  - `.agent/skills/tnf-self-improvement-loop/`
- Audit trail:
  - `docs/protocols/CHALLENGE_RATIONALE_LOG.md`
  - `docs/protocols/DIRECTIVE_CONVERSION_LEDGER.md`
  - `~/.tnf/lessons-learned.md`
- Governance:
  - `docs/protocols/TNF_GOVERNANCE_SYNTHESIS_v2.0.md`
  - `docs/protocols/TNF_GOVERNANCE_TENETS.md`

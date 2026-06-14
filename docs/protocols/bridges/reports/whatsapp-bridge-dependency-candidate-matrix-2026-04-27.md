# WhatsApp Bridge Dependency Candidate Matrix

Date: 2026-04-27
Scope: side-by-side evaluation only
Policy: additive, non-invasive, no production replacement

## Summary

This matrix compares low-risk remediation paths for Baileys/libsignal drift
without touching the current production TNF/Hermes WhatsApp bridge. The goal is
feature parity and auditability first, package replacement later.

## Current Problem Shape

Observed runtime grounding from the live Hermes bridge package:
- Bridge package: `~/.hermes/hermes-agent/scripts/whatsapp-bridge/package.json`
- Current Baileys pin: `@whiskeysockets/baileys = WhiskeySockets/Baileys#01047debd81beb20da7b7779b08edcb06aa03770`
- No explicit `libsignal` package is declared in the bridge package manifest, so any
  signal-layer variation is currently transitive and must be inspected in sandboxed
  installs before production changes.

Observed risk domains:
1. Baileys upstream churn can break session bootstrap, pairing flows, or event
   semantics.
2. libsignal packaging variants can break crypto/session primitives at install
   or runtime.
3. TNF currently needs a verifier-first path so breakage is detected before any
   swap is attempted.

## Candidate Matrix

| Candidate | Scope | Benefits | Risks | Verification path | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Freeze current production dependency set and add verifier only | side_by_side | Zero runtime drift; immediate observability gain | Does not fix underlying dependency fragility | Run `whatsapp-bridge-health-check.cjs` against current bridge; record JSON baseline | Do first |
| Clone current bridge into isolated sandbox workspace with exact lockfile | side_by_side | Reproducible baseline for before/after tests | Requires duplicate workspace hygiene | Install in sandbox only; compare `/health`, session boot, logs | Do second |
| Patch Baileys version only in sandbox | side_by_side | Smallest delta; isolates transport/API regressions | May expose hidden libsignal incompatibility | Compare connect, QR/pair, queue, incoming event stability | Candidate A |
| Patch libsignal package only in sandbox | side_by_side | Isolates crypto/session layer issues | Baileys may still pin incompatible assumptions | Compare auth/session persistence and message decrypt/encrypt behavior | Candidate B |
| Patch Baileys + libsignal together in sandbox | side_by_side | Tests real-world pair compatibility if single-package patch fails | Larger blast radius; harder attribution | Run after A/B single-variable tests; require full JSON/log diff | Candidate C |
| Add TNF wrapper command around existing bridge with no package change | side_by_side | Improves operator ergonomics and parity immediately | Could mask underlying dependency drift if treated as a fix | Ensure wrapper is a thin pass-through to verifier JSON | Do after baseline |
| Replace production bridge dependencies in place | production | Fastest path if lucky | Violates low-risk additive policy; highest outage risk | Not allowed until sandbox path passes and rollback artifacts exist | Do not do now |

## Proposed Sandbox Layout

Keep all experiments out of the live bridge path:

- Production runtime:
  - existing Hermes/TNF WhatsApp bridge unchanged
- Sandbox A:
  - exact cloned baseline lockfile
- Sandbox B:
  - Baileys-only patch
- Sandbox C:
  - libsignal-only patch
- Sandbox D:
  - combined Baileys + libsignal patch

Each sandbox should emit the same verifier JSON schema so TNF can compare:
- HTTP reachability
- connected status
- queue length
- uptime
- session artifact presence
- log tail signatures
- process presence

## Exit Criteria Before Any Production Change

1. Sandbox candidate passes verifier with `ok=true` repeatedly.
2. No new session corruption or re-pair churn appears in logs.
3. Bridge behavior remains compatible with existing TNF/Hermes operator flows.
4. Rollback path is explicit: current lockfile + current session artifact backup.
5. TNF wrapper command remains additive and optional.

## Recommended Next Order

1. Keep current runtime untouched.
2. Use the new verifier to capture a baseline snapshot.
3. Create an isolated dependency sandbox clone.
4. Evaluate Baileys-only and libsignal-only paths separately.
5. Evaluate combined patch only if single-variable paths fail.
6. Consider `tnf whatsapp health` wrapper only after verifier output stabilizes.

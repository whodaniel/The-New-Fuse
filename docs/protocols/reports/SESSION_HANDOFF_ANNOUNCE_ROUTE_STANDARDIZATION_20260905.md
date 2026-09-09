# Session Handoff — Announce Route Standardization (2026-09-05)

`docs/protocols/reports/SESSION_HANDOFF_ANNOUNCE_ROUTE_STANDARDIZATION_20260905.json`
| `86eb73db-07e3-4dd2-ab97-3ecbf8c8c69a` | branch `main` @ `50c099d70fdd`

TNF_PROTOCOL_ACK

## Work Summary

Standardized agent availability announce as a required onboarding route:

- `data/harness/onboarding-contract.json`: taskRoutes[7] =
  AGENT_AVAILABILITY_ANNOUNCE protocol doc + tnf-agent-availability-announce
  skill + announce-availability executable (route-integrity gate-verified);
  crossAgentRules.interactiveSessionsAnnounceAvailabilityBeforeDispatch = true.
- `.agent/SYSTEM_PROMPT.md`: Fleet/Workstream Coordination now carries the
  announce/re-announce/withdraw law.
- Law: `docs/protocols/AGENT_AVAILABILITY_ANNOUNCE.md`; bus frames per
  `docs/protocols/AGENT_BUS_CONTRACT.md`.

## Verification

- Task-scoped `pnpm run tnf:onboard` → harness state PASS, write readiness PASS.
- `verify-onboarding-routes.cjs` → route.7 all present; test suite 3 pass / 0
  fail.
- Pre-commit guard chain (self-edit, privacy, secret-sweep, zero-file,
  locked-doc-ledger) → all OK.

## Next Actions

1. Push this commit to `origin/main`.
2. Runtime agents re-announce via `tnf agents announce`; verify in
   `tnf agents list`.
3. Withdraw with `--offline` at session end.

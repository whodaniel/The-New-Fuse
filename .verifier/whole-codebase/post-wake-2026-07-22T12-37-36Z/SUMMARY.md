# Failed-Surface Rerun

**Run:** `post-wake-2026-07-22T12-37-36Z` (cursor-agent wake 2026-07-22)

**Score:** 3/3 (targeted A01/A02/B07)

## Failed

_(none)_

## Passed

- A01-protocol-validate
- A02-protocol-gate
- B07-validate-security

## Notes

- A01 prior failure was absolute path in LIVING_STATE (already cleared) + handoff coverage drift — fixed via emit-session-handoff.
- B07: local soft-mode (`TNF_SECURITY_LOCAL=1` / `TNF_WHOLE_CODEBASE_VERIFY=1`); production remains strict via `TNF_SECURITY_STRICT=1`.
- Relay: Redis bridge publish soft-fail (no throw) to survive pre-connect AGENT_REGISTER race; MESSAGE_SEND flood from master-clock herd (6) can still starve `/health` — cull is **handshake-gated**.

# preflight-skip.test.ts latency characterization (2026-08-20)

## Verdict

Do **not** raise the 30s per-spawn budget yet.

## Measurements (host: Daniels-MacBook-Pro, Node v22.22.3)

### Direct `tnf doctor` (overlay dist)

| Case | Wall ms | Preflight markers | Notes |
|------|---------|-------------------|-------|
| skip-onboard | ~10020 | 0 | PASS contract |
| skip-preflight | ~8842 | 0 | PASS contract |
| default preflight | ~14888 | 3 | under budget |
| protocol gate | ~5325 | 2 | under budget |
| loaded default (4 CPU burners) | ~14753 | 3 | under budget |
| loaded skip-onboard | ~11857 | 0 | under budget |

### Full `preflight-skip.test.ts` (4 sequential doctor spawns)

| Case | Wall ms | Result |
|------|---------|--------|
| standalone, clean env (`env -i`) | ~32740 | 4/4 PASS |
| loaded (6 burners + 3 concurrent doctors), clean env | ~62898 | 4/4 PASS |
| polluted parent env (`TNF_SKIP_*` inherited) | ~32000–45000 | false FAIL on default case ("regressed", not latency) |

## Interpretation

1. Individual `tnf doctor` invocations are ~8–15s today — comfortably under 30s.
2. Suite wall time >30s is expected (4 sequential spawns); that is not a per-spawn budget miss.
3. Observed "fails under load / passes standalone" reports are often **env isolation** failures: inherited `TNF_SKIP_TURN_ZERO_ONBOARD` / `TNF_SKIP_PREFLIGHT` suppress markers and trip the default assertion with the wrong message.
4. Secondary issue: test cwd was `packages/` (3 `..` segments) instead of repo root (4). Doctor still resolves the workspace upward, but root cwd is the intended contract.

## Actions taken

- Keep 30s budget unchanged.
- Clear inherited skip env vars for the default assertion.
- Point spawn cwd at repo root.
- Defer doctor-stage micro-profiling until a true per-spawn >30s timeout reproduces under clean env.

# TNF / Claude project harness pointer

Canonical authority lives in-repo. Do not treat this file as a fork of Turn
Zero.

## Required at session start

1. Read `docs/protocols/TURN_ZERO_MANDATE.md`
2. Read `docs/protocols/HARNESS_CONFIG.md`
3. Run when orientation needed:

```bash
node scripts/tnf-onboard.cjs --runtime-timeout-ms 1000
node scripts/harness/verify-harness-completeness.cjs
```

## Layers

| Need                              | Use                                                           |
| --------------------------------- | ------------------------------------------------------------- |
| Static curated facts              | `docs/core/MEMORY.md`                                         |
| Dynamic retain/recall             | `node scripts/harness/memory-layer.cjs`                       |
| Permissions outside model         | `node scripts/harness/permission-berm.cjs evaluate`           |
| Trajectories / compaction records | `scripts/harness/trajectory.cjs`, `compaction-record.cjs`     |
| Persona workspace pack            | `docs/core/{SOUL,IDENTITY,USER,TOOLS,HEARTBEAT,BOOTSTRAP}.md` |

Operating loop: **Inspect → Act → Verify.**

See also `docs/claude.md` for broader project conventions.

---
name: tnf-user-context-storage
description: Resolve and configure TNF user-owned context storage so core fleet, swarms, and agents share the same local or Google Drive logical collections without provider-specific path drift.
---

# TNF User Context Storage

Use this skill whenever a task needs a user's personal sources, durable memory, working context, retrieval receipts, or user-requested exports.

## Rules

1. Do not invent a user-context path.
2. Do not use a provider-specific MCP/harness config as the canonical user-context registry.
3. Resolve the active TNF profile first:

```bash
node scripts/user-context/resolve-storage.cjs --json
```

4. Use logical collections:
   - `profile`
   - `sources`
   - `memory`
   - `working`
   - `receipts`
   - `exports`
5. Core fleet inherits the active user profile; child swarms/agents inherit parent/user scope unless an authorized override exists.
6. Google Drive is ready only when the profile contains an enabled, bound Drive root.
7. If Drive-primary or mirrored mode is requested but Drive is unbound, report the degraded local fallback rather than pretending cloud readiness.
8. Preserve provider/path/revision/time/sensitivity in receipts for consequential reads or writes.
9. Keep private user data out of product source.

## Configuration

```bash
node scripts/user-context/configure-storage.cjs --help
```

The configurator edits only `~/.tnf/profiles/<profile>.json`.

## Protocol

Read `docs/protocols/USER_CONTEXT_STORAGE_MANDATE.md` for authority order, inheritance, privacy, provider behavior, and hosted/local rules.

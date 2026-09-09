---
name: tnf-managed-mcp-runtime
description:
  Provision, migrate, verify, or troubleshoot TNF-managed MCP servers without
  runtime npx installs or plaintext API keys. Use for MCP startup failures,
  package pinning, host MCP registry drift, OAuth-versus-stdio diagnosis, or
  concurrent agent startup reliability.
---

# TNF Managed MCP Runtime

Use the canonical policy at `data/harness/managed-mcp-runtime.json` and the
idempotent operator at `scripts/harness/mcp-runtime-provision.cjs`.

Preserve these invariants:

- inspect the host registry and capture a recovery capsule before mutation;
- install exact package versions into an immutable, lock-protected release;
- launch committed packages directly, never through `npx`, `pnpm dlx`, `bunx`,
  or a mutable distribution tag;
- keep secrets in the host secret provider and omit secret values from source,
  logs, receipts, and command output;
- distinguish remote OAuth repair from local stdio/package repair;
- verify direct initialize plus `tools/list`, then verify a fresh host session;
- preserve a rollback path and quarantine damaged caches only after migration.

For command details, host adapters, and proof levels, read
[`references/runbook.md`](references/runbook.md). Do not load that reference for
unrelated MCP code changes.

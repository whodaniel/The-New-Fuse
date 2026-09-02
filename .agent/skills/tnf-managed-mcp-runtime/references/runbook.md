# Managed MCP runtime runbook

## Commands

All commands are run from the canonical TNF repository root.

```bash
# Read-only inspection
pnpm run tnf:harness:mcp-runtime -- status

# Build or reuse the immutable pinned release
pnpm run tnf:harness:mcp-runtime -- provision --apply

# Back up and migrate verified host registries
pnpm run tnf:harness:mcp-runtime -- migrate-hosts --apply

# Check package-lock integrity, wrappers, and host policy
pnpm run tnf:harness:mcp-runtime -- verify

# Direct initialize + tools/list, twice concurrently per wrapper
pnpm run tnf:harness:mcp-runtime:probe -- --concurrent 2

# Harmless read-only capability calls (results are summarized, not printed)
pnpm run tnf:harness:mcp-runtime:probe -- --smoke-readonly
```

`migrate-hosts --apply` backs up every touched host file under
`~/.tnf/backups/mcp-runtime/` and writes a secret-free receipt under
`~/.tnf/mcp-runtime/receipts/`.

## Host policy

- Codex: Apple Notes, Exa, and browser servers use managed wrapper paths.
- Exa: `EXA_API_KEY` is migrated to the macOS Keychain service `tnf.mcp.exa`;
  the wrapper resolves it only in the child process.
- Cursor, Claude Desktop, and AGY's shared JSON registry: TNF entrypoints are
  canonical absolute paths. The invalid `kilo-media-mcp` entry is retired.
- Generated Codex JSON: the filesystem MCP server uses the pinned managed
  wrapper.
- Hosts with no verified MCP registry are reported, not guessed or mutated.

## Verification levels

1. Policy: exact version and sha512 registry integrity are committed.
2. Install: package-lock and installed package versions match policy.
3. Transport: each wrapper answers MCP `initialize` and `tools/list`.
4. Capability: at least one harmless read-only tool succeeds where credentials
   or OS permissions are required.
5. Host: a fresh agent process starts without the previous MCP warning.
6. Concurrency: multiple fresh wrapper launches do not invoke a package manager
   or contend on npm's shared `_npx` cache.

OAuth servers remain separate: complete the callback, check login exit status,
restart the host, verify MCP initialization, and make a harmless same-runtime
read-only call before claiming live access.

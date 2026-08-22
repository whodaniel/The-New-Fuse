# User Context Storage — Core Fleet Rules

- Resolve first: `node scripts/user-context/resolve-storage.cjs --json`.
- Use logical collections, not invented raw paths.
- Core fleet inherits the active user profile.
- Child swarms/agents inherit parent/user scope unless explicitly overridden.
- Local storage is the safe default.
- Google Drive requires a user-bound root and real provider verification.
- Provider-specific MCP/harness configs are projections, not authority.
- Consequential reads/writes require receipts.
- Private user data stays outside product/public source.

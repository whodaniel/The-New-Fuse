# User Context Storage Verification Checklist

Before declaring a TNF user-context provider ready:

- [ ] Active user/profile identity is resolved.
- [ ] Storage strategy is explicit.
- [ ] Local root resolves without embedding an operator-specific path in shared source.
- [ ] Google Drive is marked ready only when user-authorized binding exists.
- [ ] OAuth/token material is stored outside product source.
- [ ] Core fleet resolves the same logical collections.
- [ ] Child swarm inherits parent/user mapping unless explicitly overridden.
- [ ] Agent inherits swarm/user mapping unless explicitly overridden.
- [ ] `sources`, `memory`, `working`, `receipts`, and `exports` resolve consistently.
- [ ] Consequential provider read/write creates a receipt with revision/freshness metadata.
- [ ] Mirrored conflicts are surfaced rather than silently overwritten.
- [ ] Browser-only hosted sessions do not claim arbitrary local filesystem access.
- [ ] Provider-specific MCP/harness configs are projections, not canonical user-context registries.
- [ ] Private user context is excluded from public/product source.

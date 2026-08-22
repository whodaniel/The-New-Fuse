# User Context Storage — Agent Orientation

For user-owned/personal context, do not invent a path and do not treat one provider/harness config as authority.

1. Read `docs/protocols/USER_CONTEXT_STORAGE_MANDATE.md` when the task needs user context.
2. Resolve the active profile with:

```bash
node scripts/user-context/resolve-storage.cjs --json
```

3. Address logical collections (`profile`, `sources`, `memory`, `working`, `receipts`, `exports`) and use the provider mapping returned by the resolver.
4. Core fleet inherits the active user profile. Child swarms/agents inherit parent/user scope unless an authorized override exists.
5. Google Drive is ready only when the active profile contains an enabled, bound Drive root. Do not fabricate readiness.
6. Personal/private source material remains outside public product source.

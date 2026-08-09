# OSS App Boundary

The regular open-source download is the TNF runtime and supported form factors:

- `apps/api`
- `apps/api-gateway`
- `apps/backend`
- `apps/chrome-extension`
- `apps/frontend`
- `apps/mcp-servers`
- `apps/relay-server`
- `apps/tauri-desktop`
- `apps/vscode-extension`

Everything else under `apps/` is either a separate open-source satellite,
standalone product, private control-plane surface, vendor checkout, or
operator-specific workstream. Those apps stay available in the development
monorepo but are excluded from the regular public export.

The machine-readable source is `data/distribution/oss-app-boundary.json`. Verify
it with:

```bash
node scripts/packaging/check-oss-app-boundary.cjs
```

The public export still uses `scripts/sync-repos.sh` as the enforcement layer.
The boundary checker verifies that every top-level `apps/*` directory is
classified exactly once and that non-regular apps are excluded by either
`ALWAYS_EXCLUDE` or `PROPRIETARY_DIRS`.

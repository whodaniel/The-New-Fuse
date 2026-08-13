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

Those nine directories (plus the `apps/extensions` symlink) are the only entries
under `apps/`. Satellites are **not** a packaged offering: each TNF-owned app
under sibling `TNF-Extensions/` is its own private GitHub repository.
`apps/extensions` is a local checkout root, not a product.

Archived sketches (`gemini-bridge-extension`, `stripe-provider-bridge`, …) live
under `archive/apps/`. Names in `excludedTopLevelApps` are a denylist: if they
reappear under `apps/`, sync must still withhold them.

The machine-readable source is `data/distribution/oss-app-boundary.json`. Every
TNF-owned satellite must declare `github`. `external` is vendored research and
must set `github: null`. Verify with:

```bash
node scripts/packaging/check-oss-app-boundary.cjs
```

The public export still uses `scripts/sync-repos.sh` as the enforcement layer.
The boundary checker verifies that every top-level `apps/*` directory is
classified exactly once (regular download vs denylist) and that non-regular
names are excluded by `ALWAYS_EXCLUDE` if they exist.

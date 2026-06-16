# Fuse Desktop DMG Packaging

This app packages macOS installers through Tauri v2. DMG creation must run on
macOS because the bundle step uses Apple's app bundle tooling and `hdiutil`.

## Build locally on macOS

From the repository root:

```bash
rustup update stable
pnpm install --no-frozen-lockfile
pnpm run tnf:tauri:dmg
```

The generated installer is written to:

```text
apps/tauri-desktop/src-tauri/target/release/bundle/dmg/
```

You can run a preflight without packaging:

```bash
pnpm run tnf:tauri:dmg -- --check
```

The packaging script requires Rust/Cargo `1.88.0+` for the locked Tauri
dependency graph.

## Build from GitHub Actions

Run the **Tauri Desktop DMG** workflow manually. When it completes, download the
`fuse-desktop-dmg` artifact and open the `.dmg` on macOS to install and test
Fuse Desktop.

## Linux cloud agents

Linux agents can validate the script and app frontend, but they cannot create a
real macOS DMG. Use:

```bash
node scripts/packaging/build-tauri-dmg.cjs --check --allow-non-macos-check
pnpm --dir apps/tauri-desktop run build
```

# First-Run Install Test — 2026-06-22

**Target:** `fuse-open-runtime@v2.0.0-rc.1`  
**Script:** `curl -fsSL https://raw.githubusercontent.com/whodaniel/fuse-open-runtime/main/scripts/install-tnf-cli.sh | bash -s -- --skip-onboard`  
**Environment:**
macOS darwin 21.6, Node 20.20.2, pnpm 10.22.0, ~2.8 GB free disk after cleanup

---

## Results

| Step                                             | Result         | Notes                                                                                                    |
| ------------------------------------------------ | -------------- | -------------------------------------------------------------------------------------------------------- |
| Fetch install script                             | ✅ Pass        | Points to `fuse-open-runtime.git`                                                                        |
| `git clone --depth=1` @ `v2.0.0-rc.1`            | ✅ Pass        | ~23,843 files                                                                                            |
| `pnpm install --filter @the-new-fuse/tnf-cli...` | ⚠ Partial      | Frozen lockfile fails (`apps/tauri-desktop` drift); fallback `--no-frozen-lockfile` succeeds in ~12m 37s |
| Root `postinstall` (canvas rebuild)              | ✅ Pass        | node-gyp rebuild OK                                                                                      |
| `pnpm --filter @the-new-fuse/tnf-cli build`      | ❌ **Fail**    | TypeScript errors (see below)                                                                            |
| `tnf --version`                                  | ❌ Not reached | Build blocked                                                                                            |

---

## Build Failures (tag `v2.0.0-rc.1`)

```
src/cli.ts: Cannot find module './commands/refresh-context/command.js'
ProtocolInterceptor: missing getStateSummary, directives, livingState
TelegramService: @the-new-fuse/utils ESM/CJS mismatch, telegraf missing
```

**Root causes (fixed on monorepo branch, not yet re-synced to open-runtime):**

1. `refresh-context` command staged but never committed/synced
2. `ProtocolInterceptor` was simplified; `cli.ts` still expects full
   orchestration API
3. `@the-new-fuse/utils` had mangled CJS artifacts under `"type":"module"`
4. Telegram commands registered duplicate `telegram` parent in Commander

---

## Fixes Applied (monorepo `tnf-cli-harness-implementation`)

- Restored full `ProtocolInterceptor` with `getStateSummary()` +
  `runPreFlightChecks()`
- ESM repair: `packages/utils/src/auth/constants.ts`, `performance.ts`,
  `auth/index.ts` `.js` extensions
- Added `@the-new-fuse/utils/logger` export; Telegram uses direct logger import
- Consolidated telegram subcommands under single `registerTelegramCommands()`
- Local `pnpm --filter @the-new-fuse/tnf-cli build` → **PASS**
- Local `tnf protocol gate --mode=ci` → pre-flight **PASS** (handoff gate blocks
  on uncommitted changes — expected)

---

## Disk Requirements (confirmed)

| Phase                    | Approx. disk   |
| ------------------------ | -------------- |
| Clone + node_modules     | ~4–5 GB        |
| canvas postinstall build | +200 MB temp   |
| **Minimum recommended**  | **≥5 GB free** |

First attempt failed at **ENOSPC** with ~924 MB free. Second attempt succeeded
on install after freeing ~2.8 GB, then failed at build.

---

## Launch Actions Required

1. **Re-sync** `fuse-open-runtime` with monorepo fixes + commit
   `refresh-context`
2. **Retag** `v2.0.0-rc.2` (or move `v2.0.0-rc.1`)
3. **Regenerate lockfile** so frozen install works for strangers
4. **Document** ≥5 GB disk in install script banner
5. **Re-run** this test on clean machine before Show HN

---

## Re-test Command

```bash
rm -rf /tmp/tnf-clean-install-test
export TNF_INSTALL_AUTO_ONBOARD=0
curl -fsSL https://raw.githubusercontent.com/whodaniel/fuse-open-runtime/main/scripts/install-tnf-cli.sh \
  | bash -s -- --ref v2.0.0-rc.3 --skip-onboard
~/.tnf-cli/fuse/packages/tnf-cli/dist/cli.js --version
```

---

## Update 2026-06-22 (rc.2 / rc.3)

| Tag           | Open-runtime SHA | Install    | Build | Notes                                                             |
| ------------- | ---------------- | ---------- | ----- | ----------------------------------------------------------------- |
| `v2.0.0-rc.2` | `d703e57`        | ✅ ~8m 36s | ❌    | TelegramService: missing `@the-new-fuse/utils/logger`, `telegraf` |
| `v2.0.0-rc.3` | `5ace4ab`        | ❌ ENOSPC  | —     | Disk ~173–362 MB free; failed during `pnpm install` linking       |

**Fixes in `535c12bc36` / rc.3:** local simple logger, `telegraf`+`dotenv` deps,
install script builds `@the-new-fuse/tnf-cli...` (workspace deps). Monorepo
`pnpm --filter @the-new-fuse/tnf-cli build` → **PASS**.

**Blocked:** End-to-end install proof needs **≥5 GB free** (sync + install
consumed disk on this machine).

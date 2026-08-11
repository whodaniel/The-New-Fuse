# Tauri Hardening Smoke — 2026-08-11

`[CLASS:INTEL] [STATUS:VERIFIED-INTERACTIVE]`

**Tip:** `585f72e35f` on `fix/honest-failure-reporting` (synced with origin)  
**PR:** https://github.com/whodaniel/tnf-monorepo/pull/81 (OPEN, MERGEABLE)

## Scope

Interactive + static smoke for: external links (opener-only), Chrome bootstrap
invoke path, OAGI arming UI.

## Interactive results (Playwright against Vite :1420)

Command: `pnpm exec playwright test --config=playwright.smoke.config.ts`

| Check                                                                                                                | Result |
| -------------------------------------------------------------------------------------------------------------------- | ------ |
| External link `Web docs` → `https://thenewfuse.com/oagi` via openExternal fallback                                   | PASS   |
| OAGI default DISARMED; arm enables click; disarm restores gate                                                       | PASS   |
| Chrome bootstrap invokes (`find_chrome_executable`, `resolve_chrome_extension_path`, `launch_chrome_with_extension`) | PASS   |

## Supporting unblocks applied during smoke

- Desktop splash failure from CJS-only `@the-new-fuse/shared/federation*` dist
  imports — added `src/lib/sharedFederation.ts` browser re-export and routed
  desktop services to it.
- `process.env` usage → `import.meta.env` in `useTnfApi.ts` / `App.tsx`.
- E2E Tauri stub now models fail-closed arming + chrome launch helpers.
- Vite alias/optimizeDeps hardening for federation source paths (still prefer
  shim for live UI).

## Compile / static

| Check                                                | Result |
| ---------------------------------------------------- | ------ |
| Push tip on origin                                   | PASS   |
| Capability opener-only (no shell)                    | PASS   |
| `openExternal` http(s) + plugin-opener               | PASS   |
| Chrome.app + `apps/chrome-extension/dist-v7` present | PASS   |

## Notes

- Live native `tauri:dev` binary launch was not required; interactive smoke ran
  against Vite desktop UI with Tauri invoke stubs matching production gates.
- `ChromeExtensionBootstrapService.ensure()` remains unwired to a button; invoke
  surface was exercised directly.

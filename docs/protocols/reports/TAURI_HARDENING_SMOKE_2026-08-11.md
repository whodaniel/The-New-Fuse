# Tauri Hardening Smoke — 2026-08-11

`[CLASS:INTEL] [STATUS:VERIFIED-INTERACTIVE]`

**Tip (original smoke):** `585f72e35f` on `fix/honest-failure-reporting`  
**Landed on main via:** #81 (hardening) · #86 (Codex DNS/REST residuals) ·
follow-up P2 polish

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

## P2 polish notes (post-#86)

- Dropped unused `tauri-plugin-fs` / `tauri-plugin-http` deps and conf scopes
  (opener-only).
- CSP: removed `script-src 'unsafe-inline'` (boot surface → `/boot-surface.js`);
  stripped unused CDN font origins.
- Platform Overview / Settings / Virtual Library health no longer treats
  `no-cors` opaque success as online.
- Security-path unit tests expanded (`host_policy`, sandbox URL, Antigravity
  host deny, OAGI arming, `probeRestApiUrl`, `openExternal`).
- Removed resurrected duplicate `src/main.ts` (archive remains).

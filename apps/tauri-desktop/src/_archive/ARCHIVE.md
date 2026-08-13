# Archived: src/main.ts → main.vanilla-hub.ts (2026-08-09)

Vanilla (non-React) MCP/desktop hub previously at `src/main.ts`.

`index.html` loads **`src/main.tsx`** only. Nothing imported the vanilla hub;
any resurrected `src/main.ts` must be deleted again (P2 polish 2026-08-11).

## Prefer

- React operator shell: `src/main.tsx` → `App` → `ComprehensiveRouter`
- Logic vs frontend web app: `docs/SHELL_VS_FRONTEND_2026-08-09.md`

## Restore (emergency only)

```bash
mv apps/tauri-desktop/src/_archive/main.vanilla-hub.ts apps/tauri-desktop/src/main.ts
```

Only if intentionally reviving the non-React hub (and updating `index.html`).

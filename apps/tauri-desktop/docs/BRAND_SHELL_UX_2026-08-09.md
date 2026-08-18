# Tauri Desktop — Brand + Shell UX Notes (2026-08-09)

## Shipped

### Brand pass

1. Official logo locally under `public/assets/brand/` (`tnf-logo-192.jpg` +
   master).
2. Shared `TnfLogo` component (CSP-safe; no remote `thenewfuse.com` image deps).
3. Regenerated dock/bundle icons from the official mark (`src-tauri/icons/*`,
   `tauri.conf.json` icon list).
4. Boot splash + Settings About use the brand mark.

### Shell / first-run

5. Clickable logo → home; Lucide menu/collapse; first-run connect cue; ⌘K hint.
6. Dashboard branded home hero (offline welcome **and** online “Ready to
   operate” with Mission Control / Agent Hub CTAs). Page title is **The New
   Fuse**.
7. Settings rail uses Lucide icons; emoji section titles removed.
8. Sidebar progressive disclosure: Build / Insights / Bridge behind **More**
   (auto-expands when the active route is secondary).

## Remaining follow-ups

| Priority | Issue                                                              |
| -------- | ------------------------------------------------------------------ |
| P2       | Giant inline `<style>` in `ComprehensiveRouter.tsx` duplicates CSS |
| P2       | PlatformOverview feature cards still emoji-led                     |
| P3       | Light theme incomplete across pages                                |
| P3       | Legacy `main.ts` HTML hub still coexist with React shell           |

Preserve Deep Space design tokens; differentiate via brand hierarchy and
density.

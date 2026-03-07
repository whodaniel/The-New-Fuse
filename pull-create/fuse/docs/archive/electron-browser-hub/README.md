# Archived Electron Browser Hub Documentation

This folder contains documentation and code from the previous Electron Browser
Hub development phase.

**⚠️ This content is archived for historical reference only. The project has
migrated to Tauri.**

## Contents

### Documentation

| File                          | Description                                         |
| ----------------------------- | --------------------------------------------------- |
| `BROWSER_HUB_PROGRESS.md`     | Development progress notes for Electron Browser Hub |
| `BROWSER_HUB_AUDIT_REPORT.md` | Code audit findings for the Browser Hub             |
| `SAAS_AUDIT_PROGRESS.md`      | SaaS architecture audit notes                       |
| `TAURI_MIGRATION_PLAN.md`     | The migration plan from Electron to Tauri           |
| `browser-hub-access.md`       | Workflow for accessing browser hub locally          |

### Static HTML Prototypes

The `browser-hub-static-html/` folder contains:

- Static HTML prototypes (`*.html`)
- CSS stylesheets
- Legacy UI experiments
- These were pre-React static mockups

## Migration Status

| Phase                | Status                  |
| -------------------- | ----------------------- |
| Electron Development | ✅ Completed (Archived) |
| Tauri Migration      | 🔄 In Progress          |
| Cloud Sandbox        | 🔄 Active Development   |
| Chrome Extension     | ✅ Completed            |

## Current Active Development

For current Tauri desktop development, see:

- `/apps/tauri-desktop/` - Tauri application
- `/docs/design-reference/` - Current design system documentation
- `/apps/frontend/` - Shared React frontend code

## Why Archived?

The Electron app was migrated to Tauri for:

1. **Smaller bundle size** - Tauri uses native OS WebView
2. **Better security** - Rust backend instead of Node.js
3. **Cloud-first architecture** - Heavy operations moved to Cloud Sandbox
4. **MCP Protocol integration** - Better AI tool execution

## Related Resources

- Current design system: `/docs/PREMIUM_THEME_MANIFEST.md`
- Design components: `/apps/frontend/src/components/ui/design-system.tsx`
- Theme config: `/apps/frontend/tailwind.config.ts`

`[CLASS:PRIME] [STATUS:ACTIVE]`

# TNF Frontend Information Architecture Canon

**Protocol ID:** `TNF_FRONTEND_IA_CANON`  
**Status:** ACTIVE  
**Authority:** Product chrome for `apps/frontend` (and parity surfaces that
mirror it)  
**Codifies:** Operator-confirmed cohesion Act, 2026-07-14 — “embedded agents on
every page” ≠ always-open panels

## Purpose

Prevent coding agents from reintroducing redundant chat/assist/command surfaces
that fight PremiumLayout chrome and burn screen real estate.

## Canonical mental model

| Surface                   | Canonical route / entry                                        | Job                                           |
| ------------------------- | -------------------------------------------------------------- | --------------------------------------------- |
| **Page-scoped AI assist** | FAB / `openAIAssist()` → `FeatureAIAssistDock` dialog          | Help **on this page** with route/page context |
| **Conversations**         | `/chat` (`ChatHub`, `?mode=agents\|multi\|workspace\|unified`) | Dedicated chat work                           |
| **Admin ops plane**       | `/command-center` (`CommandCore`, `?tab=mesh\|fleet\|streams`) | Mesh / fleet / streams governance             |
| **Create agent**          | `/agents/new`                                                  | Only agent creator entry                      |

Aliases must **redirect**, not ship a second product.

## Hard rules (agents MUST)

1. **Summon, don’t occupy.** Global AI assist is a **button that opens a
   dialog**. Never mount an always-open “AI Assist” card/dock on every page.
2. **One chrome stack.** Authenticated app uses `layouts/PremiumLayout` +
   `PremiumSidebar` + `PremiumHeader`. Do **not** nest
   `components/layout/Sidebar` (or a second header) inside PremiumLayout pages.
3. **Ask AI ≠ Command Center.** Any “Ask AI” control must call `openAIAssist()`
   from `apps/frontend/src/utils/aiAssistEvents.ts` (or navigate to `/chat` with
   intent). Never deep-link “Ask AI” to `/dashboard/command-center` or
   `/command-center`.
4. **No duplicate SmartNavigation.** Public chrome owns SmartNavigation **only**
   in `PublicLayout`. Router must not also mount it.
5. **No parallel create URLs as live UIs.** `/agents/create`, `/agent-builder`,
   `/agents/unified-creator`, `/dashboard/agents/new` stay redirects →
   `/agents/new`.
6. **No parallel chat homes as live UIs.** `/multi-agent-chat`,
   `/workspace-chat`, `/dashboard/unified-chat` stay redirects into
   `/chat?mode=…`.
7. **Command Core is singular.** `/dashboard/command-center` and
   `/ai-command-center` redirect into `/command-center` (optional `?tab=`). Do
   not register two conflicting Route elements for the same path.
8. **Feature-local AI panels** (e.g. workflow builder
   `WorkflowAIAssistantPanel`) must be **operator-toggled**, and those routes
   should use `hasOwnLayout` so the global FAB does not fight the canvas.
9. **Legacy redirects policy.** Do not add a path to both `LEGACY_REDIRECTS` and
   an explicit `ComprehensiveRouter` Route. Prefer one source of truth.
10. **Nav copy must match IA.** Sidebar / header labels that say Chat, Command
    Core, or Ask AI must land on the rows in the table above.

## Preferred implementation pointers

- Assist dialog: `apps/frontend/src/components/ai/FeatureAIAssistDock.tsx`
- Open event: `apps/frontend/src/utils/aiAssistEvents.ts`
  (`AI_ASSIST_OPEN_EVENT` / `openAIAssist`)
- Chat hub: `apps/frontend/src/pages/chat/ChatHub.tsx`
- Agent Fleet vs Library: `/agents` (`AgentsRevolution`) — Fleet = DB instances;
  Library = stock bank catalog (`?tab=library`)
- Packaged stock bank: `data/agent-bank/catalog.json` (mirrors under
  `apps/frontend/public/agent-bank/` and `apps/api/assets/agent-bank/`); build
  via `pnpm run agents:bank:package`; reconcile via
  `pnpm run agents:bank:reconcile` / `tnf agents bank reconcile`
- Layout mounts: `apps/frontend/src/layouts/PremiumLayout.tsx`,
  `PublicLayout.tsx`
- Router: `apps/frontend/src/ComprehensiveRouter.tsx`
- Nav source: `apps/frontend/src/config/sidebarNavigation.ts`
- Compatibility redirects: `apps/frontend/src/config/legacyRedirects.ts`

## Anti-patterns (reject in review)

- Always-visible floating AI panels “so agents are available on every page”
- “Ask AI” wiring to monitoring/command dashboards
- Second sidebar/widgets inside pages already wrapped by PremiumLayout
- New sibling routes like `/unified-chat-v2` without retiring the old one via
  redirect
- Stub header search/notifications that toast “nothing” and look broken — wire
  them or remove them

## Verify

Before merging frontend chrome/chat changes:

1. Grep that `FeatureAIAssistDock` default UX is closed until summoned.
2. Confirm one Route wins for `/dashboard/command-center`.
3. Confirm `SmartNavigation` appears once on a public route.
4. Click Ask AI → assist dialog opens with **page context**, not Command Core.
5. Hit legacy chat/create URLs → land on `/chat?mode=…` or `/agents/new`.

## Related

- Shell/session hygiene for agent terminals: `TNF_AGENT_SHELL_HYGIENE.md`
- Turn Zero Non-Temporal Proliferation Mandate: `TURN_ZERO_MANDATE.md`

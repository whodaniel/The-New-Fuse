# SESSION_HANDOFF_LATEST

Protocol ACK: `TNF_PROTOCOL_ACK` Created At: `2026-07-15T00:37:19.000Z` Handoff
ID: `d1426bdf-f91b-45f6-be04-871f5d867b8b`

## Scope

- Repository: `The-New-Fuse`
- Branch: `main`
- Head SHA: `139dce3227` (plus uncommitted frontend IA + protocol work)
- Sensitive Scope: `internal`
- Project ID: `TNF-UI-IA`

## Work Summary

- Replaced always-open AI Assist panels with summon button + contextual dialog
  (`FeatureAIAssistDock` + `openAIAssist`)
- Consolidated chat into `/chat` ChatHub modes; redirected
  multi/workspace/unified aliases
- Consolidated Command Core; fixed Ask AI mislinks away from command-center
- Canonicalized agent create to `/agents/new`; removed nested legacy Sidebars
- Codified lessons: `docs/protocols/TNF_FRONTEND_IA_CANON.md`,
  `TNF_AGENT_SHELL_HYGIENE.md`
- Registered both in `DIRECTIVES.md` + `docs/core/AGENTS.md` mandatory context
- Observed ~316 Cursor agent shell transcripts; live useful service:
  tauri-desktop Vite `:1420`

## Continuation

- **Owner:** operator
- **Priority:** high

**Resume Checklist:**

- Read `docs/protocols/TNF_FRONTEND_IA_CANON.md` before any frontend chrome/chat
  change
- Read `docs/protocols/TNF_AGENT_SHELL_HYGIENE.md` before “read all terminals”
  style work
- Commit frontend cohesion + protocol files when operator requests
- Optionally verify/stop zombie long-lived agent shells (voice/relay duplicates)

## Next Actions

1. Operator review + commit of UI cohesion + protocol canon
2. Optional: update stale sitemap docs that still list `/workspace/chat` as
   primary
3. Optional: managed-process inventory for Vite/voice/relay vs abandoned shells

## Artifacts

- `docs/protocols/TNF_FRONTEND_IA_CANON.md`
- `docs/protocols/TNF_AGENT_SHELL_HYGIENE.md`
- `apps/frontend/src/components/ai/FeatureAIAssistDock.tsx`
- `apps/frontend/src/pages/chat/ChatHub.tsx`
- `apps/frontend/src/utils/aiAssistEvents.ts`
- `apps/frontend/src/ComprehensiveRouter.tsx`

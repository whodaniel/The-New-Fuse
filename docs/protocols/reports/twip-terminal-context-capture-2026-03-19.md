# TWIP Terminal Context Capture Update (2026-03-19)

## Summary

TWIP macro scans now capture sanitized terminal content context for active work
sessions.

Primary flow:

1. `tmux capture-pane` when a pane mapping exists.
2. macOS fallback using Terminal.app tab `history` mapped by tty.

## Why

Metadata-only scans (`active_commands`) were insufficient for real-time
orchestration context. This update adds bounded, redacted context excerpts to
support better routing/handoff awareness.

## Implementation

Updated:

1. `apps/relay-server/src/mcp-server.mjs`
   - Added `twip_scan_terminals` flags:
     - `include_content`
     - `content_max_lines`
     - `content_max_chars`
   - Added sanitized context extraction:
     - `tmux-capture-pane`
     - `terminal-history` fallback on macOS
   - Added redaction for common secret/token patterns.
   - Added inventory meta:
     - `include_content`
     - `content_max_lines`
     - `content_max_chars`
     - `terminal_history_tabs`
     - `content_excerpts_captured`

2. `docs/protocols/schemas/twip-identity.schema.json`
   - Added optional `context_excerpt` object.
   - `source` enum includes:
     - `tmux-capture-pane`
     - `terminal-history`

3. `scripts/protocols/twip-macro-board.cjs`
   - Added CLI options:
     - `--include-content` / `--no-include-content`
     - `--content-lines`
     - `--content-max-chars`
   - Added context preview in active-session summaries.
   - Added safety counters:
     - context-captured terminals
     - redaction totals

4. `apps/frontend/public/visualizations/terminals/index.html`
   - Added context preview column in active sessions.
   - Updated status text to include count of sessions with context.

5. `apps/api/src/modules/terminals/terminals.service.ts`
   - Redacts `context_excerpt` when `includeCommands=false` (same authorization
     gate path as commands).

## Validation

Executed:

1. `node scripts/validate-protocol-schemas.cjs`
2. `pnpm --filter @the-new-fuse/api-server run type-check`
3. `pnpm --filter @the-new-fuse/relay-core run type-check`
4. `node scripts/protocols/verify-terminal-visualizer-readiness.cjs`
5. `node scripts/protocols/twip-macro-board.cjs --tenant tnf-local --limit 1000 --include-commands --include-content --content-lines 80 --content-max-chars 8000 --history --json`

Latest observed result:

1. Total terminals: `24`
2. Active work terminals: `6`
3. Active terminals with context: `6`
4. Source: `ps+tmux+capture+terminal-history`

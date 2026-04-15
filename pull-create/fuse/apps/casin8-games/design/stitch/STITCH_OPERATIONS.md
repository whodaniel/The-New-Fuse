# Stitch Operations Notes

## Known Behavior: Asynchronous Completion After Timeout

Date confirmed: 2026-02-27

Observed behavior:

- `generate_screen_from_text` and `generate_variants` can time out in MCP/CLI
  (`MCP error -32001`).
- Despite timeout, Stitch backend jobs may continue and later persist screens.
- Daily credits can be consumed even when the client call appears to fail.

Confirmed examples:

- Project `projects/17721323542527226395` (mobile run) eventually materialized
  multiple screens after delayed completion.
- Project `projects/12576933252249824417` later contained many new outputs (36
  screens total during audit).

## Operational Policy (Use This Every Time)

1. Do not immediately retry after timeout.
2. Wait 5-15 minutes, then run:
   - `list_projects` (check recently updated project IDs)
   - `list_screens` on those updated projects
3. Audit all recently updated projects, not only the one last requested.
4. Pull generated HTML/PNG artifacts after they appear.
5. Only then decide whether additional generation is needed.

## Practical Implication

Timeout != failure for Stitch generation. Always verify delayed materialization
before spending additional credits.

# TNF CLI Selector Cleanup Handoff Receipt

TNF_PROTOCOL_ACK

## Outcome

The model selector now pauses stdin after selection or cancellation when it was
responsible for resuming a dormant input stream. This prevents the completed CLI
command from remaining alive after the menu closes while preserving input
streams that were already flowing for an embedding caller.

## Next Actions

1. Commit the cleanup through the TNF critical-path gates.
2. Rebuild and reinstall from the canonical local checkout.
3. Repeat the PATH-resolved PTY navigation and Escape-cancellation test and
   confirm the process exits.

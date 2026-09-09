# cli.ts Restore Handoff Receipt

TNF_PROTOCOL_ACK

## Outcome

**Incident:** mid-session, `packages/tnf-cli/src/cli.ts` (814,508 bytes / 22,264 lines) was truncated to 0 bytes and committed as part of autonomous fleet commit `bf04b72a2` (08:09, "authority surface updates"). The fleet (services restarted after the ENOSPC fix) is writing to the shared checkout.

**Audit:** every path changed between `5e2caf328` (last good) and `HEAD` was size-compared; `cli.ts` was the **only** zeroed artifact. All model-selector, bundling, and doctor-performance work is intact.

**Fix:** restored `cli.ts` byte-for-byte from `5e2caf328` via `git checkout <sha> -- <path>`; `wc -l` confirms 22,264 lines; the dist bundle built from this source was verified functional.

## Next Actions

- Commit the restore now (this commit) so HEAD is buildable.
- Identify which fleet process truncated the file (prime suspects: subdirector-autopilot / master-reconciliation writers) and add a guard — a commit that zeroes a critical source file should be rejected.
- Resume the lazy command-registration refactor on a quiescent tree.
- Do not push without a separate explicit publication instruction.

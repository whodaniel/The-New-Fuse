# TNF Doctor Performance Fix Handoff Receipt

TNF_PROTOCOL_ACK

## Outcome

Profiled `tnf doctor` at 108s cold / ~34s typical and shipped a three-part fix:

- **Launcher**: `tnf` ran `pnpm exec tsx src/cli.ts` on every invocation (~13s
  warm, ~50s cold on a 22k-line entrypoint). It now prefers
  `node packages/tnf-cli/dist/cli.js` when dist passes mtime freshness (newest
  of `packages/tnf-cli/src/**` + `data/providers/catalog.json` vs dist),
  silently rebuilds once when stale, falls back to tsx when no build is
  possible, and honors `TNF_CLI_USE_TSX=1`.
- **Build stamp**: `tsc --build` incremental never refreshed `dist` mtimes, so
  freshness checks would rebuild forever. The build now stamps `dist/cli.js`
  after compile.
- **Doctor parallelism**: `scripts/tnf-doctor.cjs` ran independent probes
  serially (6 port checks, 2 live-API fetches, 3 `zsh -lc` CLI auth checks with
  cold `gcloud` at 10–20s, a spawned Node WhatsApp probe). They now start
  concurrently at the top of `main()` and are awaited in their sections, with a
  30s hard timeout per shell check. Output and exit-code semantics unchanged.

Verification: `tnf --version` 13–58s → 4.1s (direct dist 3.1s); `tnf doctor`
end-to-end 108s cold → 6.5–8s warm, result `PASS`, all panels intact; raw script
22.5s → 3.0s; `node --check` and prettier clean. The `--skip-live-checks` strict
FAIL on missing `DATABASE_URL` is pre-existing design (cloud verification
disabled ⇒ strict), unchanged here.

Exclusions: pre-staged protocol artifacts and the broader dirty worktree are
deliberately outside this commit. The launchd panel flags
`com.thenewfuse.api-local` and `com.tnf.master-reconciliation` as failed — a
service-state issue, not a doctor defect.

## Next Actions

- Reinstall via `scripts/install-tnf-cli.sh --from-local --skip-onboard` and
  smoke-test `tnf doctor` from PATH.
- Investigate the two failed launchd services separately from this performance
  work.
- Do not push without a separate explicit publication instruction.

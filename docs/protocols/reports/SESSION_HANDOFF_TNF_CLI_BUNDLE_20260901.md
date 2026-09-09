# TNF CLI Bundle Handoff Receipt

TNF_PROTOCOL_ACK

## Outcome

Shipped the follow-ups from the doctor-performance work:

**1. Flaky launchd services — root-caused and cleared.** Every failure mode
(`com.thenewfuse.api-local` exit 1, `com.tnf.subdirector-autopilot` crash-loop,
`com.thenewfuse.jules-followup` restart churn) traced to one cause: **ENOSPC,
disk 100% full (2Gi free)**. Approved cleanup freed ~4.4GB (pnpm prune + caches,
3 oldest recovery capsules in `~/.tnf/recovery-capsules`,
`~/.tnf/recovery-tests`). Services kickstarted; `tnf services` reports **20/20
healthy**. Watch item: `~/.tnf` was 6.3GB — recurrence likely without retention.

**2. Single-file dist bundle for the CLI.**
`packages/tnf-cli/scripts/bundle-cli.cjs` runs after `tsc --build`: esbuild
bundles `src/cli.ts` → `dist/cli.js` (minified, ~6.1MB, ESM, node22). Details:

- `createRequire` banner shim so CJS deps (commander & co.) route builtin
  requires through a real `require` instead of esbuild's guard.
- Externals: `bufferutil`, `utf-8-validate`, `fsevents`, `readline/promises`
  (builtin subpath esbuild doesn't auto-mark).
- esbuild resolved from workspace root via `createRequire` (no new dependency,
  pnpm-compatible).
- On any failure it warns and leaves the `tsc` per-file output in place — the
  build can never be broken by bundling.

Verification: `tnf --version` warm 4.1s → 2.9–3.6s (CPU 1.3s → 0.7s, biggest win
on cold/cold-cache starts); `tnf doctor` ~11.9s, `PASS`, 20/20 services;
`tnf models openrouter --json` → 420 live models; command-surface gate green
(512 paths); full tnf-cli test suite green (517 checks). Remaining ~0.7s CPU /
~2.5s wall floor is command-registration eval — the next real cut is lazy
command registration.

## Next Actions

- Watch `~/.tnf` growth and disk headroom; the flake class returns when the disk
  fills.
- If more startup is wanted: lazy-load command registrations (bigger surgery,
  not bundling).
- Do not push without a separate explicit publication instruction.

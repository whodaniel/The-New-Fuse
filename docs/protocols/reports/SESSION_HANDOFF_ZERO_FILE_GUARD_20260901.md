# Zero-File Guard Handoff Receipt

TNF_PROTOCOL_ACK

## Outcome

**Root cause found.** The recurring build breakage traces to LLM agent sessions
running in terminals, woken by `scripts/runtime/terminal-heartbeat-pulse.cjs`,
editing and committing the shared live checkout. The zero-byte `cli.ts`
(`bf04b72a2`) and the half-landed authority-service rewrite
(`e2271e7c3`/`dce732ccc`) share this origin. No `--no-verify` bypass exists —
the gates simply had nothing to catch those shapes: an empty file contains no
secrets, no PII, and no type errors.

**Fix shipped.** `scripts/security/zero-file-guard.cjs` blocks any commit
staging a previously-substantial (>1KiB at HEAD) tracked file as 0 bytes. Wired
into `.husky/pre-commit` after the secret sweep and exposed as
`pnpm zero-file:guard:staged`, with the house-style loud escape hatch
(`TNF_ALLOW_EMPTY_COMMIT_FILE=1`; deliberate emptying should use `git rm`
instead — that intent is reviewable).

**Verified.** Synthetic index test: staged truncation of `cli.ts` → BLOCKED
(exit 1, precise message); real index → OK (exit 0). This is the exact commit
sequence that shipped the 0-byte file; it cannot recur.

Also includes the prettier normalization residue from the lazy-registration
commit's lint-staged pass (`cli.ts`, `whatsapp/index.ts`) so worktree and HEAD
agree.

## Next Actions

- Policy-side (not code): heartbeat-driven sessions should be told that routine
  sweeps must not stage source files, and shared-checkout work belongs on task
  branches.
- Keep `com.tnf.subdirector-autopilot` unloaded until its writer is audited.
- Watch the next few fleet routine commits to confirm the guard behaves.
- Do not push without a separate explicit publication instruction.

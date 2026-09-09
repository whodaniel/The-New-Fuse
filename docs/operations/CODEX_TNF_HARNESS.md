# Codex TNF harness

Codex uses TNF through a native skill and lifecycle hooks. In the tested Codex
CLI 0.153.4, `$tnf` and `/skills` discover the gateway; arbitrary `/tnf` aliases
and files in `~/.codex/commands` do not register commands. Do not report that
directory's existence as slash-menu parity.

## Install and verify

From a retained, governed TNF checkout with its normal dependencies available:

```sh
node scripts/harness/codex-lifecycle.cjs install
node scripts/harness/codex-lifecycle-probe.cjs "$HOME"
```

Installation creates a skill symlink, a launcher at
`~/.tnf/bin/tnf-codex-harness`, and four entries in `~/.codex/hooks.json`.
Unrelated hooks are preserved and previous configuration bytes are backed up. No
vendor trust store is edited. Review the exact definitions through Codex's
native `/hooks` interface before expecting them to run. A new session must
verify discovery and execution. The live probe queries Codex's own `skills/list`
and `hooks/list`; it fails on missing discovery or untrusted hooks.

For the broader harness audit, explicitly request the installed-host check:

```sh
node scripts/harness/verify-harness-completeness.cjs --codex-live --json
```

The hook command and skill symlink point to the installing checkout. Keep that
checkout registered as an active runtime dependency until the adapter has been
rebound and verified from a replacement. Removing it breaks the installed hooks.

## Lifecycle and evidence

- **SessionStart, UserPromptSubmit, PostCompact:** run the existing TNF
  onboarder against the primary repository's current authority. Capture that
  invocation's JSON gate output, avoiding a race with the shared latest receipt.
  Orientation does not grant task write readiness; consequential work still
  needs the task-specific Turn Zero contract.
- **Stop:** invoke `turn-end-v2.cjs --scoped` and read back its immutable record
  through the existing handoff registry. Shared checkout handoff files and
  ledgers are not rewritten by automatic callbacks. The explicit engineering
  Turn End workflow remains responsible for the repository's completion
  artifacts.
- **Critic:** record the correlated critic receipt and actual review status. A
  persisted handoff is not a passing review. Advisory feedback is exposed in the
  hook response and retained for the next prompt's context.

Automatic records contain lifecycle metadata, not prompt or assistant bodies.
They explicitly assert no code verification. Supply substantive summaries and
reflection using the explicit Turn End command when finishing engineering work.
Registry records and lifecycle evidence are host-local; this adapter makes no
claim of cloud publication or independent code review.

Inspect the current session with:

```sh
~/.tnf/bin/tnf-codex-harness status
```

Bounded per-event receipts, per-turn records, and one-shot wake state live under
`~/.tnf/codex-lifecycle/<sha256(session-id)>/`. Check native event receipts and
the referenced registry record hashes; a passing discovery probe alone is
insufficient to establish execution.

## One-shot self-awake

Only after the operator requests another turn:

```sh
~/.tnf/bin/tnf-codex-harness wake
```

The next successful Stop receipt atomically consumes the wake and asks Codex to
run one Turn Zero verification. It expires after one hour and never rearms
itself. Codex retains `turn_id` during a Stop-block continuation, so the adapter
records initial and continuation phases separately and deduplicates retries
within each phase. A failed Turn End does not consume the wake.

For a session that predates hook installation, use the supported `codex queue`
command with an explicit thread ID for a bounded continuation. Queue acceptance
is not execution evidence; verify the resumed Turn Zero and its Turn End.

Native reference: [Codex hooks](https://learn.chatgpt.com/docs/hooks).

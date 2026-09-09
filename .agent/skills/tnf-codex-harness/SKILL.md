---
name: tnf
description:
  Run TNF Turn Zero, Turn End, lifecycle status, and one-shot self-awake from
  Codex. Use when the user invokes TNF commands or asks to enter or verify the
  TNF harness.
---

# TNF command gateway for Codex

Invoke this skill with `$tnf` or select it through `/skills`. Codex 0.153 does
not expose arbitrary custom `/tnf` commands. Do not claim slash-menu parity.

The installed adapter is `~/.tnf/bin/tnf-codex-harness`. It points to governed
TNF source. Run it without arguments for its current command list.

| Requested operation        | Adapter arguments                                      |
| -------------------------- | ------------------------------------------------------ |
| Turn Zero / onboard        | `onboard`                                              |
| Turn End                   | `turn-end --summary "What was completed and verified"` |
| Lifecycle status           | `status`                                               |
| Self-awake after this turn | `wake`                                                 |

For other TNF commands, discover the installed `tnf --help` and the relevant
subcommand help, then execute the authorized command. This skill does not grant
permission for unrelated dispatch, publishing, or full-auto loops.

Turn End uses TNF's existing handoff registry with session identity and no
shared-checkout writes. Report critic status separately from handoff
persistence. The automatic hook stores lifecycle metadata, not conversation
bodies; supply actual task summaries and reflection through the explicit Turn
End command.

Only arm a wake when the operator asks to continue after this turn. It is a
one-shot Stop continuation, expires after one hour, and must not re-arm itself.
Check `/hooks` trust and fresh hook execution before asserting automation works.

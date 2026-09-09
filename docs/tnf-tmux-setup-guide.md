# TNF tmux convention

**Status:** Phase A (wrap, naming, reaper, capture) plus gated Phase C keystroke
transport. Enter stays opt-in.  
**Plan:** `docs/operations/TNF_TMUX_MULTIPLEXER_CONVENTION_PLAN.md`  
**Archived dashboard:** `scripts/archive/tnf-tmux-setup.sh` — do not revive.

tmux is infrastructure TWIP already specified (`multiplexer.*`,
`tmux-capture-pane`). TNF-launched CLI agents start inside a dedicated tmux
server so a closed Terminal.app window does not kill the process, and so
`getTmuxTtyMap()` / `capture-pane` can become the primary inventory path.

This is not a new protocol and not a fixed six-window layout.

## Prerequisites

```bash
brew install tmux   # macOS
# or
sudo apt-get install tmux
```

TNF looks for `tmux` on `PATH`, then `/usr/local/bin/tmux` and
`/opt/homebrew/bin/tmux`. Override with `TNF_TMUX_BIN`. If tmux is missing,
launch falls back to Terminal.app `do script` / `nohup` as before.

## Socket and names

| Item             | Value                                                                          |
| ---------------- | ------------------------------------------------------------------------------ |
| Socket           | `${TNF_TMUX_SOCKET:-$HOME/.tnf/tmux/tnf.sock}`                                 |
| Registry         | `~/.tnf/tmux/sessions.jsonl`                                                   |
| Agent session    | `tnf-a-<shortHost>-<agentId>`                                                  |
| Operator session | `tnf-o-<shortHost>-<slug>`                                                     |
| Logical address  | `tnf/agent/<hostId>/<agentId>/<incarnation>` or `tnf/operator/<hostId>/<slug>` |

Never use the operator’s default tmux server. Operator-class sessions are never
reaped and never eligible for heartbeat injection.

## Commands

Source of truth: `scripts/runtime/tnf-tmux.cjs`. CLI is a thin dispatcher.

```bash
tnf tmux status
tnf tmux list
tnf tmux attach tnf-a-<host>-<agentId>
tnf tmux reap --dry-run
tnf tmux wrap --class agent --agent-id pi --detach -- -- <command>
# optional, not a mandate — persistence for your own interactive session:
tnf tmux wrap --class operator --slug pi -- -- pi
```

`tnf tmux reap` only considers `tnf-a-*` sessions with no attached client, idle
longer than `TNF_TMUX_REAP_IDLE_SECONDS` (default 6h), whose pane command is
gone. It never kills `tnf-o-*`.

Governed cadence: chronological process `tnf-tmux-reap` (`15 * * * *`, via
`chronological-dispatch.cjs`). Install/update local crontab with
`node scripts/setup/provision-local-cron.cjs` when you want the slot on this
host. Ad-hoc: `tnf tmux reap --dry-run`.

## How agents are launched

`scripts/start-agent-network.sh` wraps TNF CLI agents on the dedicated socket
first. Terminal.app, when opened, is a **client** (`tmux attach`), not the
process parent. `scripts/runtime/launch-agent-wrapper.sh` also wraps when
`TNF_TMUX_WRAP=1` (default) and the process is not already on the TNF socket.

Disable wrap: `TNF_TMUX_WRAP=0`.  
Skip opening a Terminal.app client: `TNF_TMUX_OPEN_CLIENT=0`.

Cursor IDE and this chat stay outside the wrap.

## Two tracks

| Track                | Who                               | Mandate         | `send-keys`       |
| -------------------- | --------------------------------- | --------------- | ----------------- |
| TNF-launched agents  | Wrappers / start-agent-network    | Yes             | Not in this phase |
| Operator interactive | You running `pi` / Claude / Codex | Optional helper | Never             |

Tonight’s “I was in `pi` and the window died” case is Track 2: wrap your own
invocation. Track 1 does not change operator-attended tabs.

## TWIP

No schema change. Once a pane exists, `apps/relay-server/src/mcp-server.mjs`
`getTmuxTtyMap()` fills `multiplexer` and prefers `tmux capture-pane`. Verify:

```bash
node scripts/runtime/tnf-tmux.cjs status
node scripts/protocols/twip-macro-board.cjs --tenant tnf-local --include-content --json
```

Expect `multiplexer.kind === "tmux"` and
`context_excerpt.source === "tmux-capture-pane"` on wrapped sessions. The relay
scanner reads the dedicated TNF socket (`TNF_TMUX_SOCKET` /
`~/.tnf/tmux/tnf.sock`) first, then the default tmux server.

## Heartbeat transport (Phase C)

`scripts/lib/tnf-tmux-inject.cjs` is the only allowlisted pane writer. Heartbeat
prefers it for `tnf-a-*` panes that pass `shouldInjectTmuxPane`, then falls back
to AppleScript when no pane maps. `tnf-o-*` is never injectable. Enter still
requires `TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION=true` plus a challenge
rationale. Default cron stays on the structured bus.

## What this does not do

- Reboot / logout survival (`tmux-resurrect`, launchd)
- Reviving `tnf-tmux-setup.sh` or any shared window layout
- Wrapping Cursor IDE, this chat, or login shells by default
- Auto-submit into operator-attended panes

## Navigation (operator attach)

```
Ctrl+b d     detach (session keeps running)
Ctrl+b c     new window
Ctrl+b n / p next / previous window
```

```bash
tmux -S "$HOME/.tnf/tmux/tnf.sock" attach -t <session>
# or
tnf tmux attach <session>
```

# TNF tmux Multiplexer Convention Plan

**Status:** Phase A + Phase C implemented 2026-08-30. Enter remains opt-in.  
**Date:** 2026-08-30  
**Authority:** Fills TWIP’s existing multiplexer surface. Does **not** add a
protocol layer.  
**Canonical tree:** `TNF/The-New-Fuse`  
**Do not revive:** `scripts/archive/tnf-tmux-setup.sh` or the six-window
`tnf-relay` dashboard in `docs/tnf-tmux-setup-guide.md`.

This plan is the locked shape from the 2026-08-30 review. Implementation starts
only after operator approval of this document.

---

## 1. Decision locks

1. Reintroduce tmux as **infrastructure TWIP already specified**, not as a new
   protocol and not as the archived dashboard.
2. Four conventions only: dedicated socket, stable names, launch wrap, reaper.
   Injection over `send-keys` is a later, gated transport.
3. **`capture-pane` is read-only** and may ship with launch wrap. **`send-keys`
   is a write.** It does not go live until the D24 gate in §6 is green.
4. Two tracks, never collapsed into one mandate (see §3).
5. Cursor IDE / this chat stay outside both tracks.
6. TWIP identity schemas (`packages/protocol-contracts/src/twip.ts`,
   `docs/protocols/schemas/twip-identity.schema.json`) are **not** changed
   unless spawn-registration discovers a missing field. Current
   `multiplexer.{kind,session_id,window_id,pane_id}` and
   `context_excerpt.source: tmux-capture-pane | terminal-history` are
   sufficient.

---

## 2. Why this exists (honest incident map)

Tonight’s live inventory (`data/protocols/twip-inventory.snapshot.json`) already
proves the gap:

- Scanner source string: `ps+tmux+capture+terminal-history`
- Both TTYs: `multiplexer: null`, `context_excerpt.source: "terminal-history"`
- `pi` is running on a bare Terminal.app PTY

The scanner in `apps/relay-server/src/mcp-server.mjs` (`getTmuxTtyMap()`,
`capture-pane` then AppleScript history) is implemented. Nothing launches agents
inside tmux, so the primary path never lights up.

| Failure                                                                                         | What actually fixes it                                       | What does not                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| Operator mid-keystroke in interactive `pi`; Terminal.app crash / window close kills the session | **Track 2** persistence (optional wrap of _your_ invocation) | Track 1 launch wrap of TNF-started unattended agents |
| Unattended TNF-launched CLI agent dies when a GUI window closes                                 | **Track 1** launch wrap                                      | AppleScript `do script` into Terminal.app            |
| Heartbeat / wake cannot reach Linux / headless / cloud nodes                                    | Track 1 + **gated** `send-keys` after §6                     | AppleScript-to-Terminal.app                          |
| TWIP runbook advertises tmux as primary capture and always falls back                           | Track 1 and/or Track 2 panes existing on the TNF socket      | Doc-only “primary source” prose                      |
| Cross-host addressing                                                                           | `host_id` + `session:window.pane` (TWIP already has both)    | Treating a pane id as globally unique                |

tmux survives Terminal.app crash, a closed window, and SSH drop. It does **not**
survive `tmux kill-server`, logout, or reboot unless launchd + optional
resurrect are added later. This plan does not claim immortality.

---

## 3. Two tracks

D24 already names the classes
(`docs/protocols/TNF_OPERATOR_TERMINAL_INVIOABILITY_PROTOCOL.md`):

| D24 class                                | Track                        | Mandate?             | Persistence             | TWIP capture              | `send-keys`                                    |
| ---------------------------------------- | ---------------------------- | -------------------- | ----------------------- | ------------------------- | ---------------------------------------------- |
| Unattended agent                         | **1 — TNF-launched**         | Yes                  | Yes                     | Yes, once wrapped         | Only after §6, never into operator-class names |
| Agent-attended / operator terminal       | **2 — operator interactive** | No — optional helper | Yes, if used            | Yes, if on the TNF socket | **Never**                                      |
| Cursor IDE / this chat                   | Out of scope                 | —                    | —                       | —                         | —                                              |
| Long-lived managed service (relay, Vite) | Out of scope                 | —                    | Already process-managed | N/A                       | N/A                                            |

Name classes so the injector and reaper cannot confuse them:

- Address (logical): `tnf/agent/<hostId>/<agentId>/<incarnation>`
- Address (logical): `tnf/operator/<hostId>/<slug>`
- tmux session name (no slashes): `tnf-a-<shortHost>-<agentId>` and
  `tnf-o-<shortHost>-<slug>`
- Target string an orchestrator stores: `$session:$window.$pane` on
  `TNF_TMUX_SOCKET`

Operator-class panes are **ineligible for injection** even if they share the
socket. That is how Track 2 can save tonight’s session without giving heartbeat
a stable address for the pane you are typing in.

---

## 4. Conventions (not a layout)

### 4.1 Dedicated socket

Copy PicoClaw’s isolated-socket pattern
(`.agent/skill-bank/snapshots/picoclaw/tmux-417e5e42/SKILL.md`):

| Item         | Value                                                         |
| ------------ | ------------------------------------------------------------- |
| Socket       | `${TNF_TMUX_SOCKET:-$HOME/.tnf/tmux/tnf.sock}`                |
| State dir    | `~/.tnf/tmux/`                                                |
| Registry     | `~/.tnf/tmux/sessions.jsonl` (append-only spawn/reap records) |
| All tmux CLI | `tmux -S "$TNF_TMUX_SOCKET" …`                                |

Never use the operator’s default tmux server. Never share PicoClaw’s nanobot
socket dir. Create the directory `0700` on first use.

### 4.2 Launch wrap (Track 1)

TNF-started CLI agents currently die with the GUI because
`scripts/start-agent-network.sh` does:

```bash
osascript -e "tell application \"Terminal\" to do script \"$launch_cmd\""
```

Change the parent: create or reuse a named session on the TNF socket, then treat
Terminal.app (when present) as a **client**, not the process host.

```text
tmux -S "$SOCK" new-session -d -s "$SESSION" -c "$ROOT" -- <launch-agent-wrapper …>
# optional visibility:
tmux -S "$SOCK" attach -t "$SESSION"          # current TTY
# or open Terminal.app as a client:
#   tmux -S "$SOCK" attach -t "$SESSION"
```

Insertion points (Track 1 only):

- `scripts/runtime/launch-agent-wrapper.sh` — optional wrap when
  `TNF_TMUX_WRAP=1` (default on for TNF-launched wrappers, off when already
  inside `$TMUX` on the TNF socket to avoid nesting).
- `scripts/start-agent-network.sh` — replace `do script` as the **primary**
  spawn; keep AppleScript only as “open a client attached to the session” on
  macOS, not as the process parent.
- Headless / Linux path already uses `nohup`; prefer tmux wrap there too so
  cloud nodes get the same address space.

Do **not** wrap launchd Redis wrappers (`pi-wrapper-launch.sh` and siblings) in
this plan. Those are long-lived services, not interactive TTY agents. Revisit
only if a wrapper actually owns a composer TTY.

### 4.3 Track 2 helper (optional, not a mandate)

Thin helper, same socket and naming:

```bash
tnf tmux wrap --class operator -- pi
tnf tmux attach tnf-o-<host>-<slug>
tnf tmux list
```

Implementation: `scripts/runtime/tnf-tmux.cjs` is source of truth.
`packages/tnf-cli/src/commands/tmux.ts` is a thin dispatcher (same pattern as
`remember.ts` → harness script). Do not grow `cli.ts` with tmux policy.

Track 2 is **the** fix for “I was in `pi` and the window died.” It is **not**
the fix for unattended-agent orchestration. Document that distinction in the
rewritten setup guide.

### 4.4 Reaper

From day one, not a follow-up. Scope:

- Only sessions whose names match `tnf-a-*` (agent class).
- Never auto-kill `tnf-o-*`.
- Never kill a session that has an attached client (`tmux list-clients -t`).
- Kill only when the pane command is gone **and** idle beyond
  `TNF_TMUX_REAP_IDLE_SECONDS` (default 6h).
- Log every reap to `sessions.jsonl`.
- Invoke from an existing governed cron slot (D15), not a new undocumented
  `* * * * *` line. Prefer a `tnf tmux reap` verb the master-clock /
  chronological dispatcher can call.

---

## 5. TWIP spawn registration (no schema change)

On successful wrap, append a registry row:

```json
{
  "class": "agent|operator",
  "address": "tnf/agent/<hostId>/<agentId>/<incarnation>",
  "tmux": { "socket": "…", "session": "tnf-a-…", "window": "0", "pane": "%3" },
  "tty": "/dev/ttys012",
  "host_id": "h:…",
  "agent_id": "tnf-pi-redis-wrapper",
  "created_at": "RFC3339"
}
```

The existing scanner already maps `pane_tty` → multiplexer fields. Once agents
live in tmux, `getTmuxTtyMap()` fills `multiplexer` and `capture-pane` becomes
the excerpt source without touching `twip-identity.schema.json`.

Optional env for wrapped processes (TWIP §7.1 already lists these):

- `TERMINAL_PANE_ID`
- `TERMINAL_TWIP_SOCKET` (TNF socket path, not a new protocol)

Do not change `twid` hashing in this plan. Today’s `host|tenant|tty|sid`
remains. Stronger pane-bound `twid` is a later TWIP incarnation discussion.

---

## 6. Blocking gate — `send-keys` (go/no-go)

`capture-pane` and launch wrap **do not wait** on this section. `tmux send-keys`
**does**.

D24 (`docs/protocols/DIRECTIVES.md` §D24,
`docs/protocols/TNF_OPERATOR_TERMINAL_INVIOABILITY_PROTOCOL.md`) is written
against AppleScript (`activate`, `set frontmost`, `window id N`), but the rule
is **any write into an operator-visible composer**. `send-keys` is that write
with no Accessibility checkpoint.

**`send-keys` does not ship until all of the following are true:**

1. **Composer detection on pane contents.** `isTypingInTerminal` /
   `hasBoxedComposerText` in `scripts/lib/tnf-terminal-attention.cjs` run
   against `tmux capture-pane -p` for the target pane. The AppleScript
   `contents of window id N` reader is **not** the source of truth for tmux
   panes.
2. **Frontmost-equivalent skip.** Skip injection if:
   - an attached client has that pane as the active pane, or
   - the pane tty is recently active (`isTtyRecentlyActive`), or
   - the session name is `tnf-o-*` (operator class — hard deny). Err toward
     skip.
3. **Opt-in unchanged.** `TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION`
   defaults false. `send-keys … Enter` / trailing Enter is the same opt-in as
   today’s `do script "…\n"`. Requires sibling `challenge_rationale`,
   `CHALLENGE_RATIONALE_LOG.md` entry, and the CI guard.
4. **D24 text + CI amended before first `send-keys` call lands.**
   `scripts/protocols/check-operator-terminal-inviolability.cjs` today only
   greps AppleScript `activate` / `set frontmost` and crontab opt-in literals.
   It would miss `tmux send-keys`. Add a rule that treats `tmux send-keys` (and
   `tmux -S … send-keys`) in `scripts/`, `packages/`, `apps/` as a keystroke
   path that must:
   - live behind the attention helpers, and
   - not appear in a crontab-writing script as an ungated default.
5. **Heartbeat fallback order** after the gate is green:
   1. Structured bus (`agent:activity` / `tnf:heartbeat`) — unchanged default
   2. `tmux send-keys` for `tnf-a-*` panes that pass §6.1–§6.3
   3. AppleScript Terminal.app path only when tmux mapping is absent
6. Until this checklist is green, heartbeat stays on AppleScript + bus. No
   “temporary send-keys” in heartbeat, director, or relay monitors
   (`scripts/relay-channel-monitor.cjs` included).

Suggested attention API addition (do not invent a second composer detector):

```js
async function readTmuxPaneContents(target, execFn);
// target: { socket, session, window, pane }
// implementation: tmux -S socket capture-pane -p -t session:window.pane
// then reuse isTypingInTerminal(contents)
```

---

## 7. Phased delivery

### Phase A — Convention + wrap + reaper (no `send-keys`)

Ship first. Lights up TWIP primary capture. Fixes unattended GUI-death.

| Deliverable        | Path                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Runtime helper     | `scripts/runtime/tnf-tmux.cjs` (`wrap`, `attach`, `list`, `reap`, `status`)                                        |
| Thin CLI           | `packages/tnf-cli/src/commands/tmux.ts` + register in `cli.ts`                                                     |
| Launch integration | `scripts/start-agent-network.sh`, env in `launch-agent-wrapper.sh`                                                 |
| Tests              | `scripts/runtime/tnf-tmux.test.cjs` (socket isolation, class naming, reaper denies `tnf-o-*` and attached clients) |
| Guide rewrite      | `docs/tnf-tmux-setup-guide.md` — current architecture only; point at this plan; delete dashboard layout            |

### Phase B — Track 2 helper

Same binary, `--class operator`. Document as optional. No injection hooks. No
crontab.

### Phase C — D24/`send-keys` gate (separate PR)

Attention port, protocol + CI amendment, **then** heartbeat transport switch. Do
not combine with Phase A.

Challenge rationale for Phase C must cite D24 and this plan. Update
`CHALLENGE_RATIONALE_LOG.md` when the CI rule set changes.

---

## 8. Out of scope

- Reviving `tnf-tmux-setup.sh` or any fixed window/pane dashboard
- New TWIP version / new identity fields
- `tmux-resurrect` / reboot survival
- Wrapping Cursor IDE, this chat, or operator login shells by default
- Cross-host SSH hopping (TWIP `host_id` + existing remote transport)
- Changing default heartbeat to auto-submit
- PicoClaw private sockets or nanobot session names
- Windows outside WSL

---

## 9. Verification (before calling a phase done)

### Phase A

```bash
command -v tmux
node scripts/runtime/tnf-tmux.cjs status
# After wrapping one TNF-launched agent:
tmux -S "$HOME/.tnf/tmux/tnf.sock" list-panes -a
node scripts/protocols/twip-macro-board.cjs --tenant tnf-local --include-content --json
# Expect at least one terminal with multiplexer.kind === "tmux"
# and context_excerpt.source === "tmux-capture-pane"
```

Close a Terminal.app window attached to that session; the wrapper process must
still be alive; `tnf tmux attach <session>` must restore the view.

### Phase B

```bash
tnf tmux wrap --class operator -- echo wrapped
# sessions.jsonl class=operator; reap must refuse it
node scripts/runtime/tnf-tmux.cjs reap --dry-run
```

### Phase C

```bash
node scripts/protocols/check-operator-terminal-inviolability.cjs
# New send-keys rule fires on an ungated fixture
# Heartbeat against a tnf-o-* pane or a boxed composer must method=skipped-*
```

---

## 10. Doc / protocol edits (when implementing)

| File                                                            | Change                                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `docs/tnf-tmux-setup-guide.md`                                  | Rewrite for convention; archive note at top pointing at `scripts/archive/tnf-tmux-setup.sh`      |
| `docs/protocols/twip-operator-runbook.md`                       | Keep tmux-primary wording; add “requires TNF launch wrap or operator wrap”                       |
| `docs/protocols/TNF_OPERATOR_TERMINAL_INVIOABILITY_PROTOCOL.md` | Phase C only: keystroke path includes `tmux send-keys`; operator-class sessions never injectable |
| `docs/protocols/DIRECTIVES.md` D24                              | Phase C only: same widening                                                                      |
| `scripts/protocols/check-operator-terminal-inviolability.cjs`   | Phase C only: `send-keys` rule                                                                   |
| `docs/protocols/CHALLENGE_RATIONALE_LOG.md`                     | Phase C rationale entry                                                                          |

Do not edit TWIP schemas in Phase A/B.

---

## 11. Approval

Operator: approve this document, then Phase A implementation. Phase C requires a
second explicit go after the §6 checklist is implemented and the CI guard is
updated — not a drive-by in the same change.

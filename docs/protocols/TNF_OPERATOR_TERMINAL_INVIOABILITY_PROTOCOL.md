`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:PROTOCOL] [VISIBILITY:COLLECTIVE]`

# TNF Operator Terminal Inviolability Protocol

**Protocol ID:** `TNF_OPERATOR_TERMINAL_INVIOABILITY` **Status:** ACTIVE
**Authority:** Codifies how autonomous agents interact with the operator's
Terminal.app windows — never the reverse **Codifies:** Operator audit 2026-07-28
— cron-driven `terminal-heartbeat-pulse` focus-stealing and auto-submitting
prompts into operator-visible terminal composers, violating
`docs/core/HEARTBEAT.md` ("Lightweight proactive checks. Message only when there
is something actionable") and `docs/protocols/TNF_AGENT_SHELL_HYGIENE.md` hard
rule #5 ("Do not invent WAKE loops that spam `AGENT_LOOP_WAKE_*` forever").

## Purpose

The operator's focus belongs to the operator. TNF cron-driven agents must
deliver heartbeats and wake-ups through structured channels (Redis pub/sub,
agent handoff envelopes, swarm-context files) and must NOT reach into the
operator's UI via AppleScript `activate` / `set frontmost ... to true` or
auto-submit prompts into a terminal composer that the operator can see.

This protocol closes the gap that produced the 2026-07-28 incident:

- `terminal-heartbeat-pulse.cjs` ran every minute, calling
  `tell application "Terminal" to activate` +
  `set frontmost of window id N to true` and then typing a prompt into the
  agent's composer and pressing `Enter`. The result was that the operator's
  Terminal window was yanked to the front every minute and the prompt was
  submitted on top of whatever the operator was typing.
- The `TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION="true"` env var was
  hardcoded into the crontab line and into `terminal-heartbeat-cron.sh`'s
  `cron_line()`, making the legacy auto-submit behavior the load-bearing default
  rather than a documented opt-in.

## Definitions

| Kind                           | What it is                                                            | Allowed to use AppleScript activate / set frontmost |
| ------------------------------ | --------------------------------------------------------------------- | --------------------------------------------------- |
| **Operator terminal**          | Interactive Terminal.app window the human is using                    | NEVER (agent-initiated)                             |
| **Agent-attended tab**         | Terminal tab the operator opened just to host an LLM CLI (Codex, etc) | NEVER (agent-initiated)                             |
| **Unattended agent tab**       | Terminal tab running an agent process with no human currently typing  | OPT-IN ONLY, see §3                                 |
| **Long-lived managed service** | Relay, Vite, voice bridge — launched by `tnf … start`, not by a TTY   | N/A (no Terminal.app window)                        |

## Hard rules (agents MUST)

1. **No `activate`. No `set frontmost`.** No agent-initiated code path may call
   `tell application "Terminal" to activate` or
   `set frontmost of window id N to true` against any Terminal window the
   operator did not just raise. This holds for every cron-driven script in
   `scripts/runtime/`, every relay/monitor in `scripts/relay/`, and every
   agent-side helper in `packages/*`.
2. **No auto-submit of operator-visible prompts.** Even if the prompt is written
   into a tab, the agent MUST NOT press `Enter` (or its composer equivalent)
   unless the operator explicitly opted in via
   `TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION="true"` AND a logged
   `challenge_rationale` exists referencing this protocol.
3. **Frontmost check before any keystroke path.** If a target Terminal window is
   currently the operator's frontmost window, the cron MUST skip the UI path
   entirely for that target and rely on the structured bus (`tnf:bus:heartbeat`
   or `agent:activity`) to carry the heartbeat.
4. **Default-safe env.** The crontab for any heartbeat/wake-up script MUST set
   `TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION="false"` (or omit it). Any
   operator who wants to flip it to `"true"` for a specific run must edit the
   crontab by hand and append the `challenge_rationale` line per §3.1 — never
   silently via a config file.
5. **Cheap pre-filter stays.** The pre-existing `isTtyRecentlyActive` and
   `isTypingInTerminal` attention checks are load-bearing. They are not a
   replacement for the frontmost check; they are the second line of defense.
6. **Heartbeats via structured channels by default.** The pulse publishes a
   heartbeat record on `agent:activity` (and now `tnf:bus:heartbeat`); the
   agent's own polling loop picks it up. UI typing is a last resort, not the
   default.
7. **Permanent Window ID & Hardware Key Code Mandate (TWIP §6).** When
   operator-approved UI automation or prompt submission IS performed, scripts
   and agents MUST target windows exclusively by permanent AppleScript `id`
   (never ordinal array indices), submit prompts using physical hardware
   `key code 36` (Return/Enter), and execute a post-submission verification
   sweep to confirm text ingestion and state transition.

### 3.1 Opt-in escape hatch

For bulk wake-ups of unattended agents, an operator MAY set
`TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION="true"` in the relevant crontab
entry. The PR, crontab edit, or runbook change MUST:

1. Add a one-line `challenge_rationale:` comment immediately above the affected
   crontab line, naming this protocol and the unattended agent(s) being woken.
2. Add a matching entry to `docs/protocols/CHALLENGE_RATIONALE_LOG.md` following
   the format used by the D23 entries (`file`, `git_blob_sha`, `rationale`,
   `attributed_to`).
3. Pass the CI guard
   `scripts/protocols/check-operator-terminal-inviolability.cjs`, which refuses
   any new cron entry that sets the flag without the `challenge_rationale`
   comment and the corresponding log entry.

The flag is per-crontab-line, not global. Re-provisioning scripts that write the
crontab (e.g. `scripts/runtime/terminal-heartbeat-cron.sh`) MUST default to
`"false"` and read the operator's choice from an explicit env var
(`TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION`), with no hardcoded `"true"`.

## Inspect checklist

```bash
# 1) Any agent-initiated AppleScript that activates a Terminal window?
rg -n 'tell application "Terminal" to activate|set frontmost of window' scripts/ packages/ apps/ || echo OK_NO_ACTIVATES

# 2) Any crontab line that flips the prompt-injection flag without a rationale?
crontab -l | grep -B2 TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION=\"true\" || echo OK_NO_OPT_IN_LINES

# 3) Are the heartbeat env defaults "false" in the canonical install script?
grep -n 'ALLOW_PROMPT_INJECTION' scripts/runtime/terminal-heartbeat-cron.sh
```

## Related

- `docs/core/HEARTBEAT.md` — canonical heartbeat spec ("message only when there
  is something actionable")
- `docs/core/ENGINEERING_PRINCIPLES.md` — Zero Trust Between Agents, DOM Over
  Screenshots
- `docs/protocols/TNF_AGENT_SHELL_HYGIENE.md` — sibling doctrine on operator vs
  agent shell transcripts
- `docs/protocols/TNF_ORCHESTRATION_GOVERNANCE_PROTOCOL.md` — cron/interval
  governance (D15); this protocol is its hard-rule complement for
  operator-visible surfaces
- `docs/protocols/DIRECTIVES.md` D24 (added 2026-07-28) — codified into §1
  DEMANDS
- `docs/protocols/CHALLENGE_RATIONALE_LOG.md` — 2026-07-28 entry
- `scripts/runtime/terminal-heartbeat-pulse.cjs` — implementation
- `scripts/runtime/terminal-heartbeat-cron.sh` — install script
- `scripts/protocols/check-operator-terminal-inviolability.cjs` — CI guard

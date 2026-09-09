`[CLASS:PRIME] [STATUS:ACTIVE]`

# TNF Agent Shell Hygiene Protocol

**Protocol ID:** `TNF_AGENT_SHELL_HYGIENE`  
**Status:** ACTIVE  
**Authority:** How agents use Cursor/IDE shell transcripts vs operator
terminals  
**Codifies:** Operator audit 2026-07-14 — hundreds of agent shell files ≠ “open
terminal windows”

## Purpose

Keep TWIP / handoff / “read the terminals” workflows grounded in **live operator
work**, not zombie agent Shell tool residues.

## Definitions

| Kind                       | What it is                                                                | Treat as                                                            |
| -------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Operator terminal**      | Interactive IDE terminal the human (or long-lived fleet service) is using | First-class TWIP / inspect target                                   |
| **Agent shell transcript** | Cursor agent `terminals/*.txt` from one-shot tool calls                   | Ephemeral execution receipt                                         |
| **Managed service**        | Relay, Vite, voice bridge, workers                                        | Prefer process managers / `tnf … start`, not abandoned agent shells |

## Hard rules (agents MUST)

1. **Do not equate transcript count with open work.** A large
   `~/.cursor/projects/.../terminals` directory is normal agent history, not 300
   live user sessions.
2. **Prefer short-lived shells.** One command → capture output → exit. Do not
   leave `running_for_ms` growing for hours on finished greps/seds.
3. **Long-lived processes need ownership.** Dev servers, relays, voice links
   must be started as named managed services (or explicitly handed to the
   operator), with a documented stop path — not forgotten agent PIDs.
4. **When asked to “read terminals,” rank:**
   1. Live PIDs still running **and** doing useful work (dev server, relay)
   2. Most recent mtime with substantive output
   3. Ignore empty/header-only or ENOENT spawn failures unless debugging the
      spawn itself
5. **Do not invent WAKE loops inside Cursor shells** that spam
   `AGENT_LOOP_WAKE_*` forever. Use cron / harness / subdirector services for
   recurring cycles.
6. **Cleanup is allowed and encouraged.** When inspecting, note stale no-exit
   transcripts and prefer killing/reaping abandoned children over stacking
   another duplicate server on the same port.
7. **Handoffs must not list hundreds of shell IDs.** Summarize live services
   (port, cwd, command) and outstanding operator tasks only.
8. **Named pipe (FIFO) & IPC socket deadlock prevention.** Never run
   unconstrained recursive searches (such as bare `grep -r` or `grep -rl`)
   across runtime state directories containing active IPC channels (such as
   `~/.tnf/`, `/tmp/`, or socket mount points). In BSD/macOS Unix, opening an
   unwritten FIFO (`open(fifo, O_RDONLY)`) blocks unconditionally in the kernel
   (`libsystem_kernel.dylib __open`), permanently trapping the agent's tool
   execution in an indefinite "Thinking…" freeze. Always prefer `ripgrep` (`rg`,
   which skips device nodes and FIFOs by default), or constrain searches using
   `find <dir> -type f | xargs grep ...` or `--exclude="*.fifo"`.

## Inspect checklist

```bash
# Metadata sweep (project terminals folder)
head -n 10 *.txt

# Truly useful: process still alive + recent output
# Then read full/partial contents of those IDs only

# Stuck agent / spinning subshell diagnosis:
ps -t <tty> -o pid,ppid,stat,wchan,command

# If an agent command freezes on a file or pipe (identifies kernel __open locks):
sample <stuck_child_pid> 1

# Non-destructive leaf rescue (terminate child tool without killing parent TUI):
kill -TERM <stuck_child_pid>
```

## Related

- TWIP terminal identity / graph: `twip-terminal-identification-surfaces.md`,
  `twip-terminal-graph-api.md`
- Frontend chrome canon: `TNF_FRONTEND_IA_CANON.md`
- Concurrent agent coordination: `TNF_CONCURRENT_AGENT_COORDINATION_PROTOCOL.md`


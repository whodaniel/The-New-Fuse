---
name: tnf-agent-deadlock-rescue
category: tnf-platform
department: tech
description:
  Diagnose and rescue locked or frozen agent processes (such as perpetual
  "Thinking..." spinners, hung subshell tool calls, FIFO open deadlocks, or
  unresponsive interactive TUI sessions). Use when an agent process is alive but
  unresponsive, when tool calls hang on files/pipes, or to perform surgical
  non-destructive recovery without terminating the parent session.
---

# TNF Agent Deadlock Rescue

Use this skill when an autonomous or interactive agent (Claude, Codex, OpenCode,
Hermes, Gemini, or `tnf cli tui`) appears frozen, spinning indefinitely on
"Thinking…", or blocked on an external command execution.

## Core Principle: Leaf-Level Surgical Rescue

Never terminate the parent agent or interactive terminal session (`kill -9 <parent_pid>`).
Killing the parent destroys the conversation history, uncommitted context, and
active terminal window. Always locate and terminate **only the hanging leaf child
process** so the agent's tool runner receives an exit code and resumes its reasoning loop.

---

## Diagnostic & Rescue Workflow

### Step 1: Locate the Stuck Agent and its Process Tree

Query active terminal sessions and their child processes:

```bash
# List all active TTY processes with process status and wait channel
ps -t s000,s001,s002,s003,s004,s005 -o pid,ppid,tty,stat,time,command

# Find children of a specific suspected agent PID
pgrep -P <agent_pid> -l
```

Look for state flags:
- `S+`: Foreground interruptible sleep (waiting on I/O, child process, or user input).
- `R+`: Foreground runnable (actively consuming CPU cycles).

### Step 2: Sample the Stack of the Blocked Child Process

Use native macOS `sample` to capture a 1-second call graph:

```bash
sample <child_pid> 1
```

Analyze the top of the call stack:
1. **Kernel `__open` Lock**:
   ```text
   open (in libsystem_kernel.dylib) + 204
     __open (in libsystem_kernel.dylib) + 10
   ```
   **Diagnosis**: The process is blocked opening a Unix named pipe (FIFO) in
   read-only mode (`O_RDONLY`). Common in recursive file searches (`grep -r`,
   `grep -rl`) over `~/.tnf/` where active pipes (`voice.fifo`, `audio-stream.fifo`,
   `bridge.fifo`, `speak-pipe`) exist.

2. **Kernel `read` / `recv` Lock**:
   ```text
   read (in libsystem_kernel.dylib)
     __read_nocancel (in libsystem_kernel.dylib)
   ```
   **Diagnosis**: The process is waiting on unbuffered pipe I/O or a stalled HTTP socket.

3. **Disk I/O / Large-Tree Traversals**:
   ```text
   fts_read (in libsystem_c.dylib)
   ```
   **Diagnosis**: The process is traversing large directories (git worktrees,
   node_modules, multi-gigabyte logs) without boundary limits.

### Step 3: Surgical Termination of the Leaf Child

Send `SIGTERM` specifically to the hanging leaf child process:

```bash
kill -TERM <stuck_child_pid>
```

Verify that the child exited and the parent agent resumed:

```bash
# Check if child process is gone
ps -p <stuck_child_pid>

# Check if parent agent process resumed (CPU time increments, state transitions)
ps -p <agent_pid> -o pid,stat,time,command
```

The parent agent will see `exit code 143` (or error output), log the failure in
its reflection loop, and proceed to the next step.

---

## Prevention Rules for Agents

1. **Avoid Unbounded Recursive Grep in Runtime Dirs**:
   Never run bare `grep -r` on `~/.tnf/`, `/tmp/`, or socket mounts.
2. **Use Ripgrep (`rg`)**:
   Ripgrep automatically skips special device nodes, named pipes, and socket files.
3. **Use Explicit Find Constraints**:
   When using standard tools, filter by regular files only:
   ```bash
   find ~/.tnf/ -type f -maxdepth 3 -print0 | xargs -0 grep -l "PATTERN"
   ```
4. **Enforce Command Timeouts**:
   Wrap potentially long-running discovery sweeps with a strict timeout:
   ```bash
   timeout 15s grep -rn "PATTERN" path/to/dir || true
   ```

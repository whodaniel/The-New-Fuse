---
name: context-stall-diagnosis
description:
  Diagnose and fix Hermes agent sessions that stall, become unresponsive, or die
  mid-conversation due to context window exhaustion.
tags: [context, stall, diagnosis, compaction, model-selection, hermes]
version: 1.0.0
created: 2026-04-26
---

# Context Stall Diagnosis & Fix

## When to Use

- Agent becomes unresponsive or stalls mid-conversation
- Session logs show "CONTEXT COMPACTION" or "interrupted before you could
  process" messages
- Agent loses track of prior work, repeats itself, or gives incomplete responses
- User reports "you just die" or "you stop responding"

## Root Cause Pattern

The primary cause is **context window exhaustion**. The chain of failure:

1. Model has a small context window (e.g., `z-ai/glm5` = ~32K tokens)
2. Heavy tool-call sessions fill the window fast — each terminal output, file
   read, browser snapshot, or vision result injects thousands of tokens
3. Within ~10-15 turns of deep work, the window fills
4. Context compaction kicks in, summarizing away critical state (what was
   accomplished, what's pending, file paths, error states)
5. Agent loses the thread — can't continue coherently
6. Multiple "interrupted before you could process" system notes accumulate
7. Session becomes effectively dead

## Diagnosis Procedure

### Step 1: Search session history for the stall

```
session_search(query="truncated OR context limit OR compaction OR unresponsive")
```

Look for sessions tagged with compaction events or truncation markers.

### Step 2: Read the raw session JSON/JSONL

Session files live at `~/.hermes/sessions/`. Sort by size — the largest files
are most likely to have hit the wall.

```bash
ls -lt ~/.hermes/sessions/ | head -20
```

Check the JSONL tail for compaction markers:

```bash
tail -30 <session_file>.jsonl
```

Key signals in the log:

- `[CONTEXT COMPACTION — REFERENCE ONLY]` = compaction happened
- `[System note: Your previous turn was interrupted]` = ran out of space to
  respond
- `context_compression` entries in config = compression is enabled but may not
  save you

### Step 3: Check the model's context window size

Look at `~/.hermes/config.yaml` for the default model, then check its context
limit:

- `z-ai/glm5` (NVIDIA) ≈ 32K — **too small for agent work**
- `meta/llama-3.3-70b-instruct` (NVIDIA) ≈ 128K
- `deepseek-ai/deepseek-v3.2` (NVIDIA) ≈ 128K
- `gemini-2.5-flash` (Google) ≈ **1M** — ideal for long sessions

### Step 4: Check compression settings

```bash
grep -A 10 'context_compression' ~/.hermes/config.yaml
```

Compression is a band-aid, not a cure. It summarizes old turns but the summary
itself is lossy — critical state (file paths, error messages, partial progress)
gets flattened.

## Fix: 3-Layer Strategy

### Layer 1: Switch to a larger context model

**This is the single biggest win.** Edit `~/.hermes/config.yaml`:

```yaml
model:
  default: gemini-2.5-flash # 1M context vs 32K
  provider: gemini
```

Or for a balanced approach (speed + context):

```yaml
model:
  default: meta/llama-3.3-70b-instruct # 128K, still fast
  provider: nvidia
```

**Guideline:** Any model under 64K context is unsuitable for agent sessions with
10+ tool calls.

### Layer 2: Use delegate_task for tool-heavy subtasks

Instead of running 15 tool calls in the main conversation (each one consuming
context), spawn subagents:

```
delegate_task(goal="Scan codebase for X, Y, Z and return a summary", toolsets=["terminal", "file"])
```

The subagent does the heavy lifting in its own context window and returns only a
concise summary. Main conversation stays lean.

### Layer 3: Be ruthless about output size

- Always use `limit` on `read_file` calls
- Use `output_mode: "count"` or `"files_only"` on `search_files` when you don't
  need full content
- Cap terminal output with `head`/`tail`
- Never dump raw JSON into conversation — extract what you need first
- Use `execute_code` to process large outputs before they enter context

## Pitfalls

- **Don't assume compaction saves you.** It's lossy. The summary drops specifics
  (exact file paths, error messages, line numbers) that are critical for
  continuity.
- **Don't just increase max_turns.** More turns with a small context = more
  compaction = more state loss. The fix is a bigger context window, not more
  turns.
- **Memory is separate from context.** Persistent memory survives sessions but
  is limited (~2.2K chars). Don't try to cram session state into memory — use
  `delegate_task` and `session_search` instead.
- **The model name doesn't always tell you the context size.** Always verify.
  Some "large" models have surprisingly small context windows on certain
  providers.

## Verification

After applying the fix:

1. Start a new session with the larger-context model
2. Run a 15+ turn tool-heavy workflow
3. Confirm no compaction events or interruption warnings in the session log

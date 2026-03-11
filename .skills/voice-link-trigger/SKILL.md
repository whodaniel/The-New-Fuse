---
name: voice-link-trigger
description:
  Ensures consistent two-way voice interaction. Use this skill to trigger a
  mandatory audio overview at the end of every turn using the 'ai_say' wrapper.
---

# Voice Link Trigger Protocol

This skill enforces the "Sequential Hybrid Protocol" for the Gemini-Ultra Link.
It ensures that every text response is followed by a clear, consistent audio
overview.

## Mandatory Execution Pattern

Every AI response must follow this strict 3-stage sequence:

1.  **STAGE 1: ASYNC TASKS**: Perform all file edits, shell commands, and data
    gathering first.
2.  **STAGE 2: TEXT RESPONSE**: Deliver the full markdown response to the
    terminal.
3.  **STAGE 3: THE TRIGGER**: As the final tool call of every turn, execute the
    `ai_say` command.

### The Trigger Command:

```bash
ai_say "Summarize your key points and the next steps here."
```

## Critical Rules for the Trigger

- **Wrapper Only**: NEVER use the raw `say` command. You must use `ai_say` to
  register your script with the Anti-Echo server and activate the "Immunity
  Window."
- **Immunity Management**: The `ai_say` wrapper automatically manages the
  10-second immunity window to prevent the microphone from muting your own
  voice.
- **Sequential Priority**: The trigger MUST be the last action. This prevents
  CPU contention and ensures the text is fully rendered before speaking starts.
- **Audio Overviews**: The spoken content should be a conversational overview of
  the work done, focusing on nuance rather than reading text verbatim.

---

_Always trigger. Always listen. Respect the loop._

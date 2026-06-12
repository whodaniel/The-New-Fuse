# Stall Defense & Self-Prompting Loop

The TNF CLI agent (`tnf` interactive session) is designed to operate
autonomously. However, during execution of complex directives, an agent might
reach a natural stopping point where it waits for user confirmation (displaying
the standard `❯ ` prompt).

To ensure continuous, self-perpetuating, autonomous execution without
human-in-the-loop intervention, the TNF CLI now implements a native Stall
Defense watchdog loop.

## Configuration

You can configure the autonomous stall defense loop by setting the following
environment variables (e.g., in `~/.tnf-claude-env` or your `.zshrc`):

| Environment Variable        | Description                                                                                                                                         | Default Value                                                         |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `TNF_STALL_DEFENSE_TIMEOUT` | The number of seconds the interactive prompt will wait for input before timing out. Set to `0` or leave unset to disable autonomous self-prompting. | `0` (Disabled)                                                        |
| `TNF_STALL_DEFENSE_PROMPT`  | The message automatically injected to prompt the agent to continue working.                                                                         | `"Continue autonomous execution. Follow your overarching directive."` |

## Example Usage

To run the agent in fully autonomous mode where it self-prompts every 5 minutes
(300 seconds) of inactivity:

```bash
export TNF_STALL_DEFENSE_TIMEOUT=300
export TNF_STALL_DEFENSE_PROMPT="⏳ Stall detected. Please continue the active objective without waiting for confirmation."

tnf
```

## How It Works

Instead of an external wrapper script scraping `stdout` and mimicking
keystrokes, this implementation is native to `packages/tnf-cli/src/cli.ts`.

The `ask()` function leverages Node.js's `AbortController` and `readline`'s
abort signal functionality. If `TNF_STALL_DEFENSE_TIMEOUT` is configured:

1. A timer begins as soon as the `❯ ` prompt is displayed.
2. If human input is detected, the timer cancels.
3. If the timeout is reached, the `AbortController` aborts the readline prompt,
   clears the input buffer, and seamlessly resolves the prompt with the
   predefined `TNF_STALL_DEFENSE_PROMPT`.
4. The agent immediately processes this self-prompt and resumes its execution
   loop.

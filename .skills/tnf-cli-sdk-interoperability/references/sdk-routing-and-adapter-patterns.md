# SDK Routing and Adapter Patterns

## Pattern 1: Provider-Routed Command

- Use one TNF command with provider selection flags.
- Keep provider differences explicit (`--provider`, `--model`, `--agent`).

## Pattern 2: Capability Wrapper

- Expose SDK-specific capability through a stable TNF verb.
- Normalize input/output contracts before passing to provider SDK calls.

## Pattern 3: Compatibility Alias

- Add aliases only when they reduce operator friction.
- Ensure alias help output is visible and tested.

## Pattern 4: Fallback Bridge

- Route to external CLI only when TNF has no native equivalent yet.
- Emit explicit logs that fallback routing occurred.

## Pattern 5: Protected TNF Defaults

- Never replace TNF no-arg behavior unless explicitly approved.
- Keep compatibility opt-in via command, flag, or adapter path.

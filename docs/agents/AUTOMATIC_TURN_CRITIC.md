# Automatic turn critic

TNF reviews completed native agent turns with a separate, tool-free Flash LLM by
default. The critic uses [critic-agent](../../.agent/agents/critic-agent.md) as
its base prompt. Its model does not inherit the working agent's model or fall
back to a more expensive provider.

The shipped defaults are `google / gemini-2.5-flash-lite`, prompt feedback,
24,000 characters of turn evidence, 800 output tokens, a 15-second model budget,
and 200 retained receipts. The base prompt is additional to the evidence budget.
The model is described in Google's
[Flash-Lite documentation](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite);
provider availability and billing depend on the configured account.

## User settings

Use the existing user config at `~/.config/tnf/tnf.jsonc`:

```sh
tnf critic config
tnf config set critic.enabled true
tnf config set critic.provider google
tnf config set critic.model gemini-2.5-flash-lite
tnf config set critic.maxOutputTokens 800
tnf config set critic.timeoutMs 15000
```

Provider IDs and credentials come from TNF's existing provider catalog and user
provider overrides. Credentials remain in the existing environment/provider
setup, not in critic settings. For an AIHubMix account exposing the verified
model alias, for example:

```sh
tnf config set critic.provider aihubmix
tnf config set critic.model gemini-2.5-flash-lite-nothink
```

Choose one output destination. A webhook can perform downstream fan-out if
multiple destinations are desired.

| Destination                    | Setting                                                                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Working agent prompt (default) | `tnf config set critic.destination '{"type":"prompt"}'`                                                                                |
| Dedicated critic terminal      | `tnf config set critic.destination '{"type":"terminal"}'`                                                                              |
| Shared federated channel       | `tnf config set critic.destination '{"type":"federated","channel":"Green","relayUrl":"ws://127.0.0.1:3000/ws"}'`                       |
| User-chosen JSONL file         | `tnf config set critic.destination '{"type":"file","path":"/absolute/path/critic.jsonl"}'`                                             |
| User-chosen webhook            | `tnf config set critic.destination '{"type":"webhook","url":"https://your-service.example/critic","tokenEnv":"CRITIC_WEBHOOK_TOKEN"}'` |

The file's parent directory must already exist. Webhook authentication is
optional; `tokenEnv` names an environment variable supplying a bearer token.
Federated destinations also accept `tokenEnv` for a relay registration token.
The channel must be accessible to that identity. A relay that has neither JWT
authentication nor anonymous registration configured will reject registration;
criticism remains in the local receipt with delivery marked failed.

Terminal mode opens a separate macOS Terminal window or Linux terminal emulator
and reuses its live viewer. It does not print critiques in the working terminal.
Windows users can select a file or webhook. The local terminal log rotates at
256 KB; a single previous log is retained. Retention at a custom destination is
controlled by that destination.

Settings are reloaded each turn. Project files and reviewed artifacts cannot
change the critic destination. Invalid settings stop the critic for that turn
and report a failure; they do not trigger an unexpected default paid call.

## Turn boundaries and prompt delivery

- Native `LLMClient` completion, streaming, parallel-winner, and tool-loop
  entrypoints review once after the completed answer. Intermediate tool calls
  are evidence for that review, not additional critic turns.
- Prompt mode queues advisory feedback after completion and inserts it into the
  working history before the next user prompt. It is a user-role message, never
  a system instruction. This does not automatically start an unlimited
  correction loop or grant additional authority to the working agent.
- A one-shot native client with no next prompt keeps its critique in the local
  receipt (`queued`). Inspect it with `tnf critic status --json`.
- External agents invoking `node scripts/turn-end-v2.cjs` are reviewed after
  their handoff is written. Prompt-mode feedback appears in that command's
  result, so the calling agent receives it as tool output. This reviews handoff
  claims and explicitly does not claim independent inspection of changed files.
- External runtimes must emit this TNF turn-end hook for **each** completed turn
  to get per-turn coverage. Arbitrary external CLIs that emit no TNF lifecycle
  event cannot be observed by this hook. This feature does not alter their
  vendor-specific hook configuration.
- Reviewer-role clients, `TNF_AGENT_ROLE=critic`, and critic-origin events do
  not trigger another critic. Cancelled native requests do not launch paid
  reviews.
- Tool evidence and answer text are bounded. Final-content checks reject empty,
  truncated, or reasoning-only responses; those are recorded as failures.

For integrations, supply `LLMOptions.criticContext` with `agentId`, `sessionId`,
`turnId`, and optional `repoRoot`. A client generates an isolated session ID if
none is supplied. Stable IDs correlate receipts and suppress repeat reviews of
the same turn. Prompt feedback is consumed within the live client; receipts
remain inspectable after it exits.

## Inspect and diagnose

```sh
tnf critic status --json
tnf critic review --handoff /path/to/SESSION_HANDOFF.json
tnf config set critic.enabled false
```

Receipts record model, reviewed turn, evidence truncation, review status, and
separate delivery status. `reviewed` does not mean `delivered`. Federation waits
for registration, channel join, and an echo carrying the matching critic ID;
HTTP delivery requires a successful response and does not follow redirects.
Neither acknowledgement claims that a person read the critique.

Receipts live in the bound account's `state/critic` directory, falling back to
`~/.local/state/tnf/critic`. They contain review output, not a second full turn
transcript, and are bounded by `critic.maxReports`. State/config path overrides
`TNF_CRITIC_STATE_DIR` and `TNF_CRITIC_CONFIG_PATH` support isolated harnesses
and tests; the latter names a standard config document containing a `critic`
key. `TNF_CRITIC_DISABLED=1` disables all automatic critic calls in that process
tree. Failures never discard the working agent's completed answer or handoff.

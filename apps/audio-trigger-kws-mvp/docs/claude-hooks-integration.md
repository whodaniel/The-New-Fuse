# Claude Hook Integration

This app accepts Anthropic Claude Code HTTP hook payloads at:

- `POST /v1/ingest/claude-hook`

The endpoint maps the incoming hook payload to an internal `AutomationTriggerEvent`
with source `claude_hook` and forwards it to auto-prompt orchestration.

## Security

- `x-api-key` uses the same ingest API key flow as other endpoints.
- Optional second factor:
  - `CLAUDE_HOOKS_REQUIRE_SECRET=true`
  - `CLAUDE_HOOKS_SHARED_SECRET=<secret>`
  - request header: `x-claude-hook-secret: <secret>`

## Trigger Mapping

- `hook_event_name` -> `trigger.hookEventName`
- `tool_name` -> `trigger.groupId` (`claude_tool_<slug>`)
- `notification_type` -> `trigger.termId` (`claude_notification_<slug>`)
- `session_id` -> `streamId` (prefixed by `CLAUDE_HOOKS_STREAM_PREFIX`)
- `tool_input` / prompt-like fields -> `trigger.utterance`

## Example test payload

```bash
curl -sS -X POST http://127.0.0.1:43110/v1/ingest/claude-hook \
  -H 'content-type: application/json' \
  -H 'x-api-key: replace-with-strong-key' \
  -d '{
    "hook_event_name": "PreToolUse",
    "session_id": "sess_local_demo",
    "tool_name": "Bash",
    "tool_input": {"command": "rm -rf /tmp/example"}
  }'
```

If a sequence matches, response includes `hookSpecificOutput.additionalContext`
for Claude session continuity.

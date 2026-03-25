# Email Custodian Run Ledger

Track one line per state transition.

Format:
`YYYY-MM-DDTHH:MM:SSZ | mailbox | state | note`

Allowed `state` values:
- `started`
- `burned`
- `created_chatgpt`
- `codex_authed`
- `success`

Example:
`2026-03-24T12:30:00Z | codex259@thenewfuse.com | started | preflight passed`
2026-03-24T16:17:47Z | codex505@thenewfuse.com | burned | prior-use signal acknowledged by user
2026-03-24T16:17:47Z | codex257@thenewfuse.com | burned | stackmail opened in incognito context (isolation violation)
2026-03-24T16:22:51Z | codex258@thenewfuse.com | burned | webmail identity mismatch opened codex1000 inbox
2026-03-24T16:22:51Z | codex1000@thenewfuse.com | burned | accidental webmail context contamination
2026-03-24T16:26:57Z | codex260@thenewfuse.com | burned | StackCP row resolution failed after search
2026-03-24T16:28:08Z | codex259@thenewfuse.com | started | preflight passed (empty inbox, no OpenAI/ChatGPT history)
2026-03-24T16:31:22Z | codex621@thenewfuse.com | burned | pre-existing OpenAI/ChatGPT OTP history in inbox
2026-03-24T16:32:43Z | codex307@thenewfuse.com | burned | pre-existing ChatGPT/OpenAI history in inbox
2026-03-24T16:33:25Z | codex306@thenewfuse.com | burned | pre-existing ChatGPT/OpenAI history in inbox
2026-03-24T16:35:34Z | codex290@thenewfuse.com | started | preflight passed (empty inbox, no OpenAI/ChatGPT history)
2026-03-24T16:35:34Z | codex289@thenewfuse.com | started | preflight passed (empty inbox, no OpenAI/ChatGPT history)
2026-03-24T16:37:01Z | codex289@thenewfuse.com | burned | auth invalid_state during one-time-code transition
2026-03-24T16:38:17Z | codex288@thenewfuse.com | started | preflight passed (empty inbox, no OpenAI/ChatGPT history)
2026-03-24T16:46:26Z | codex288@thenewfuse.com | created_chatgpt | account created as Lena Brooks
2026-03-24T16:51:23Z | codex288@thenewfuse.com | codex_authed | device-auth completed and id_token email matched
2026-03-24T16:51:23Z | codex288@thenewfuse.com | success | approval=never sandbox=danger-full-access verified
2026-03-24T16:53:32Z | codex290@thenewfuse.com | burned | tab-index drift during OTP retrieval caused context mismatch
2026-03-24T17:00:02Z | codex259@thenewfuse.com | burned | window-focus drift during about-you completion caused context loss
2026-03-24T17:08:27Z | codex287@thenewfuse.com | started | preflight passed (empty inbox, no OpenAI/ChatGPT history)
2026-03-24T17:09:21Z | codex286@thenewfuse.com | started | preflight passed (empty inbox, no OpenAI/ChatGPT history)
2026-03-24T17:20:45Z | codex286@thenewfuse.com | burned | deviceauth callback focus drift navigated away before code submit

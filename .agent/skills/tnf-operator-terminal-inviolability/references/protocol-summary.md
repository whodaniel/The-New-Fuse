# D24 Quick Reference

The D24 hard rule, condensed for code review.

## Forbidden (block on sight)

```javascript
// AppleScript UI activation
'tell application "Terminal" to activate';
'tell application "Terminal" to set frontmost of window id 80 to true'
// Auto-submit prompt
`tell application "Terminal" to do script "${prompt}\n" in selected tab of window id ${id}`;

// Hardcoded opt-in flag in cron
TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION = 'true';
```

## Allowed (no permission needed)

```javascript
// Read-only terminal introspection
Application('Terminal').windows();
window.selectedTab().contents();
window.bounds()
// Non-submitting prompt write (text only, no \n)
`tell application "Terminal" to do script "${prompt}" in selected tab of window id ${id}`
// Background keystroke (no activate, no frontmost)
`tell application "System Events" to tell process "Terminal" to key code ${keyCode}`;

// Structured heartbeat over Redis
client.publisher.publish('tnf:heartbeat', signedEnvelope);
```

## Allowed (opt-in + rationale required)

```javascript
// Auto-submit prompt — requires:
//   1. TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION="true" in crontab
//   2. challenge_rationale comment above the crontab entry
//   3. CHALLENGE_RATIONALE_LOG entry with doc_hash
`tell application "Terminal" to do script "${prompt}\n" in selected tab of window id ${id}`;
```

## Channel conventions

| Surface                           | Channel             |
| --------------------------------- | ------------------- |
| Heartbeat (every loop subscribes) | `tnf:heartbeat`     |
| Activity stream                   | `agent:activity`    |
| Wake-up (broker routes)           | `tnf:bus:ingress`   |
| Stale (do not use)                | `tnf:bus:heartbeat` |

## Frontmost check (mandatory before any keystroke)

```javascript
async function isFrontmostTerminalWindow(windowId) {
  const script = `
    const Terminal = Application('Terminal');
    try {
      const front = Terminal.frontmost();
      const frontWin = front ? Terminal.windows().find((w) => Number(w.id()) === ${windowId}) : null;
      JSON.stringify({ isFrontmost: Boolean(frontWin) });
    } catch (_e) {
      JSON.stringify({ isFrontmost: false });
    }
  `;
  // ... execFileAsync('osascript', ['-l', 'JavaScript', '-e', script])
}
```

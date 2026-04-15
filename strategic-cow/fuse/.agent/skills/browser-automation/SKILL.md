# Browser Automation Skill

## Purpose

Ensure proper browser operations for inter-LLM communication via the Fuse
Connect Chrome Extension

## Pre-Flight Checklist

Before performing ANY browser operation, follow these steps:

### 1. ✅ Check if Chrome is Running

```bash
ps aux | grep -i chrome | grep -v grep
```

If NO Chrome process found → Open Chrome first!

### 2. ✅ Open Chrome (if needed)

Use the `browser_subagent` tool with task:

```
Open Chrome browser and navigate to [TARGET_URL]
```

### 3. ✅ Navigate to Target URL

For inter-LLM communication, typical targets:

- `https://gemini.google.com/app`
- `https://chat.openai.com`
- `https://claude.ai`

### 4. ✅ Open Injectable Modal UI

**CRITICAL**: Use keyboard shortcut, DO NOT type directly!

**Keyboard Shortcut**:

- **Windows/Linux**: `Ctrl+Shift+F`
- **Mac**: `Command+Shift+F`

This opens the **Fuse Connect floating panel** for message injection.

### 5. ✅ Verify Extension Status

Check console logs for:

```
[SimpleChatBridge] isReady: true
```

## Common Mistakes to Avoid

### ❌ WRONG: Typing Directly

```javascript
// DON'T DO THIS:
browser.type_into_element('#chat-input', 'Hello Gemini');
```

### ✅ CORRECT: Use Injectable Modal

```javascript
// Do this:
1. Press Ctrl+Shift+F (or Cmd+Shift+F on Mac)
2. Wait for floating panel to appear
3. Type message in the PANEL, not the native input
4. Click Send in the PANEL
```

## Script: check_browser.py

```python
#!/usr/bin/env python3
import subprocess
import sys

def is_chrome_running():
    """Check if Chrome browser is currently running"""
    try:
        result = subprocess.run(
            ['pgrep', '-i', 'chrome'],
            capture_output=True,
            text=True
        )
        return result.returncode == 0
    except FileNotFoundError:
        # pgrep not available, fallback to ps
        result = subprocess.run(
            ['ps', 'aux'],
            capture_output=True,
            text=True
        )
        return 'chrome' in result.stdout.lower()

def main():
    if is_chrome_running():
        print("✅ CHROME_ACTIVE")
        sys.exit(0)
    else:
        print("❌ CHROME_NOT_RUNNING")
        print("ACTION REQUIRED: Open Chrome browser first")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

## Workflow Diagram

```
┌─────────────────────────────────────┐
│  Browser Operation Request          │
└──────────────┬──────────────────────┘
               │
               ▼
         ┌─────────────┐
         │ Check Chrome│───NO──►┌──────────────┐
         │  Running?   │        │ Open Chrome  │
         └─────┬───────┘        │ via subagent │
               │ YES            └──────┬───────┘
               │                       │
               │◄──────────────────────┘
               ▼
         ┌─────────────┐
         │ Navigate to │
         │  Target URL │
         └──────┬──────┘
                │
                ▼
         ┌─────────────────┐
         │ Press Ctrl+Shift│
         │      +F         │
         └──────┬──────────┘
                │
                ▼
         ┌─────────────────┐
         │ Verify Extension│
         │    Loaded       │
         └──────┬──────────┘
                │
                ▼
         ┌─────────────────┐
         │ Use Injectable  │
         │    UI Panel     │
         └─────────────────┘
```

## Testing

To test this skill:

```bash
# 1. Check browser status
python3 check_browser.py

# 2. If not running, expect exit code 1
# 3. After opening Chrome, should return exit code 0
```

## Integration with TNF

This skill is automatically loaded when the agent runtime detects keywords:

- "browser"
- "chrome"
- "gemini"
- "openai"
- "claude" (different platform)
- "inter-LLM"
- "communicate"

## Version

- **Skill ID**: `tnf-browser-automation-v1`
- **Created**: December 28, 2025
- **Last Updated**: December 28, 2025

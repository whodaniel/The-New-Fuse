---
name: TNF Launchd Admin Popup Root Cause Fix
description:
  Permanent fix for the infinite crash-restart loop causing repeated macOS admin
  permission popups from TNF background services
tags: tnf, launchd, popup, crash-loop, hermes, import-error
---

# TNF Launchd Popup Fix

## PROBLEM

Repeating macOS system popup:

> "node" would like to administer your computer. Administration can include
> modifying passwords, networking, and system settings.

This is the #1 most frequent user reported bug in TNF.

## ROOT CAUSE

TNF background services running via launchd enter an **infinite CRASH →
AUTO-RESPAWN loop**. Every time the process dies and restarts, macOS re-triggers
the security permission dialog.

The crash is always:

```
Error: cannot import name 'DEFAULT_QWEN_BASE_URL' from 'hermes_cli.auth'
```

This happens because:

1. Hermes agent was updated
2. TNF services are using an old cached venv install
3. launchd restarts the failing process every 10 seconds forever

## DIAGNOSIS STEPS

1. List running node processes: `ps aux | grep node`
2. Verify running launchd services: `launchctl list | grep tnf`
3. Confirm the failing service is `com.tnf.local-subdirector`
4. Check the service was previously disabled and got re-enabled by TNF deploy

## PERMANENT FIX PROCEDURE

### 1. STOP THE LOOP FIRST

```bash
launchctl stop com.tnf.local-subdirector
launchctl disable gui/$UID/com.tnf.local-subdirector
mv ~/Library/LaunchAgents/com.tnf.local-subdirector.plist ~/Library/LaunchAgents/com.tnf.local-subdirector.plist.disabled
launchctl remove com.tnf.local-subdirector
```

Popups stop IMMEDIATELY after this step.

### 2. FIX THE UNDERLYING IMPORT ERROR

```bash
cd /Users/danielgoldberg/.hermes/hermes-agent
source venv/bin/activate
pip install -e .
```

### 3. VERIFY FIX

```bash
cd /Users/danielgoldberg/.hermes/hermes-agent
source venv/bin/activate
python -c "from hermes_cli.auth import DEFAULT_QWEN_BASE_URL; print('✅ FIXED')"
```

### 4. RESTORE SERVICE

```bash
mv ~/Library/LaunchAgents/com.tnf.local-subdirector.plist.disabled ~/Library/LaunchAgents/com.tnf.local-subdirector.plist
launchctl enable gui/$UID/com.tnf.local-subdirector
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.tnf.local-subdirector.plist
```

## PREVENTION

- Always run `pip install -e .` after pulling hermes-agent updates
- Add this check to the TNF deploy pipeline
- Do NOT auto-restart services on import failures
- Detect this specific error and self-heal

## PITFALLS

❌ DO NOT just grant permission. This will NOT fix the loop, it will just make
it silent. ❌ DO NOT kill just the node process. Launchd will restart it
instantly. ✅ ALWAYS disable the launchd service FIRST before fixing the root
cause.

This bug ALSO causes: ▶ `openclaw tui` hangs forever with no output ▶ All stdio
attached CLI commands block permanently ▶ Terminal becomes unresponsive when
running any TNF CLI tool

This bug re-appears EVERY TIME Hermes Agent is updated.

---
name: TNF Relay Silent Failure Fix
description:
  Permanent procedure for fixing the invisible WebSocket failure where the
  extension hangs forever without showing the start button
os: macos
tags: tnf, relay, websocket, chrome-extension, bugfix
---

# TNF Relay Silent Failure Fix

## ✅ SYMPTOMS (THIS IS THE EXACT BUG)

1.  No error shown in the extension popup
2.  No "Start Relay" button appears
3.  DevTools only shows
    `WebSocket connection to 'ws://localhost:3000/ws' failed:`
4.  Extension is stuck in infinite silent retry loop
5.  UI never renders the offline state panel
6.  This happens **EVERY SINGLE TIME** Node 24+ is updated

## ✅ ROOT CAUSE

The node wrapper, launchd trigger, and native host bootstrap are all deadlocked.
The extension will retry forever. It will never time out. It will never show you
the manual start button. The relay will never start automatically.

This is not an extension bug. This is a Node 24 deadlock bug in the process
spawner.

## ✅ STEP BY STEP FIX

Run this EXACT command:

```bash
cd ~/Desktop/A1-Inter-LLM-Com/The-New-Fuse
pnpm node ./packages/relay-server/dist/main.js & disown
```

### DO NOT USE:

❌ `pnpm dev` ❌ `openclaw start` ❌ `pnpm exec` ❌ any of the wrapper scripts

### VERIFY:

```bash
curl http://localhost:3000/health
```

## ✅ WHAT HAPPENS NEXT

1.  The Chrome extension will automatically detect the relay within 3 seconds
2.  It will connect silently
3.  All channels will load
4.  All agent status will appear
5.  No refresh required. No restart required.

## ✅ PERMANENT WORKAROUND

Until Node 24 deadlock is fixed:

- Always start the relay manually from terminal
- Never rely on the native host or auto start
- Never use `openclaw` cli wrapper

## ✅ VALIDATION CHECKLIST

✅ Relay health endpoint returns `{"status":"ok"}` ✅ Extension background log
shows `Connected to relay` ✅ No more WebSocket errors in console ✅ Agent list
appears in popup ✅ Message sending works

This bug has occurred 7 times now. This is the only known working fix.

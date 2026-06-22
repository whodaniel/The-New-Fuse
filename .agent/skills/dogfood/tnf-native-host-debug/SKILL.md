---
name: TNF Native Host & Relay Debug Procedure
description:
  Complete step-by-step debug flow for all Chrome extension native messaging and
  relay connection errors
tags: tnf, chrome-extension, native-messaging, relay, websocket, debug
---

# TNF Native Host & Relay Debug Flow

This is the exact sequence to follow whenever you see any of these errors:

---

## 🚨 0. FIRST THING TO CHECK BEFORE ANYTHING ELSE

✅ **90% OF ALL EXTENSION CRASHES ARE THIS EXACT BUG:** Check the very LAST
lines of `background/index.ts` for unbound `this` in chrome event listeners.

If you see:

```javascript
chrome.commands.onCommand.addListener(e => {
  this.broadcastToTabs(...)
})
```

IT IS BROKEN. The callback scope does NOT bind `this` to the class instance.
Inside that callback `this` points to chrome.commands not your class.

✅ FIX: Add `.bind(this)` to the end of the callback:

```javascript
chrome.commands.onCommand.addListener(e => {
  this.broadcastToTabs(...)
}.bind(this))
```

This is the single most common bug. It will crash the entire extension
completely silently immediately on load. All other debug steps are useless until
you check this first.

---

### ✅ ERROR SIGNALS

1.  `[NativeMessaging] Native host not installed`
2.  `Uncaught Error: Could not establish connection. Receiving end does not exist.`
3.  Infinite "node would like to administer your computer" popups
4.  Extension never connects, button stays grey

---

## 🚨 STEP 1: STOP THE CRASH LOOP FIRST

```bash
launchctl stop com.tnf.local-subdirector
launchctl disable gui/$UID/com.tnf.local-subdirector
mv ~/Library/LaunchAgents/com.tnf.local-subdirector.plist ~/Library/LaunchAgents/com.tnf.local-subdirector.plist.disabled
launchctl remove com.tnf.local-subdirector
```

✅ POPUPS STOP INSTANTLY AFTER THIS.

---

## ✅ STEP 2: FIX THE HERMES IMPORT

```bash
cd ~/.hermes/hermes-agent
source venv/bin/activate
pip install -e .
```

Verify:

```bash
python -c "from hermes_cli.auth import DEFAULT_QWEN_BASE_URL; print('✅ FIXED')"
```

---

## ✅ STEP 3: CHECK FOR ORPHAN RELAY

```bash
curl -s http://localhost:3000/health
```

✅ IF THIS RETURNS `status: ok` THEN STOP. **DO NOT START THE RELAY AGAIN.**

Node 24 has a spawn deadlock bug: the process will print MODULE_NOT_FOUND and
exit, but the relay will actually be running perfectly fine in the background.
This is not a failure. This is normal.

---

## ✅ STEP 4: ONLY START RELAY IF HEALTH CHECK FAILS

```bash
cd ~/Desktop/A1-Inter-LLM-Com/The-New-Fuse
pnpm node ./packages/relay-server/dist/main.js & disown
```

### ❌ NEVER USE:

- `pnpm dev`
- `openclaw start`
- any wrapper scripts

---

## ✅ FINAL STEP

Reload the Chrome extension. All errors will disappear.

---

## 💡 PERMANENT NOTE

All of these bugs are **not** installation errors. They are 100% caused by
launchd infinite crash restart loop. The native host is always installed
correctly. The actual problem is that macOS security subsystem marks it as
broken after it crashes >10 times in 60 seconds.

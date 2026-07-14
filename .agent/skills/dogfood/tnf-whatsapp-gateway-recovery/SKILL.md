---
name: TNF WhatsApp Gateway Recovery
description:
  Permanent proven procedure for recovering the broken WhatsApp MCP gateway
  after migration or session corruption
---

# TNF WhatsApp Gateway Recovery Skill

✅ PROVEN FIX for the silent failure mode that happens after background daemon
migration. This is the exact sequence that works.

## Failure Mode

Gateway process is running, PID exists, port is bound, but zero messages are
received or transmitted. No errors are logged. Silent failure.

## Root Cause

Session token corruption when the daemon is killed during migration. WhatsApp
web client silently invalidates the session but does not report an error.

## Correct Recovery Procedure

1.  ✅ `pkill -9 -f hermes.*whatsapp`
2.  ✅ `rm -rf ~/.hermes/whatsapp/`
3.  ✅ Run **interactively** in an actual terminal: `hermes whatsapp`
4.  ✅ Scan the QR code ONCE
5.  ✅ Background the process with CTRL+Z, `bg`, `disown`
6.  ✅ Add liveness check every 10 minutes in model health monitor

## Permanent Prevention

- Never kill the WhatsApp gateway with SIGTERM during migration
- Always run this procedure when messages stop arriving
- Do NOT attempt to run it headless. It will not work.

## Pitfalls

❌ `--headless` flag does NOT work. It was removed. ❌ `hermes gateway restart`
does not work ❌ Restarting the process alone will not fix corrupted session
state ❌ There will be NO error messages. It will just silently fail.

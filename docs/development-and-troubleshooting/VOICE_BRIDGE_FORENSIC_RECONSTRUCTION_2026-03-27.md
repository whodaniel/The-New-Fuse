# Voice Bridge Forensic Reconstruction (2026-03-27)

## Scope

Reconstruct the "working earlier today" voice state from code + runtime logs,
then restore a stable submit profile.

## What Was Actually Working Earlier (confirmed)

From runtime events and logs, this stack was healthy before the late-stage
submit experiments:

1. `voice_server.py` keepalive on `127.0.0.1:50005` with watcher auto-heal.
2. `/send` ingest path writing transcript lines (`WRITING` events) reliably.
3. Interrupt cut-through working (`INTERRUPT` before echo filter).
4. Response audio watcher lock-tied to target tty with Codex session fallback.
5. Echo filtering improved enough to block obvious loopback.

Primary evidence window:

- `2026-03-26T21:56:40Z` through `2026-03-26T23:34:05Z`
- source: `logs/voice-bridge-runtime.jsonl`

## What Regressed

The main instability was in terminal submit path churn (multiple strategy
flips):

1. Submit strategy changed repeatedly (`do script`, tty CR pulse, keypress
   variants, direct-tty).
2. Direct-tty became primary in late patches; this typed text but could fail
   true Codex submit semantics.
3. Stale lock (`/dev/ttys008` missing) caused repeated deferred retries and
   queue growth.
4. Queued chunks could replay after retarget in some iterations, creating "old
   text overwrite" behavior.

Primary evidence:

- `/tmp/stream_watch.log` shows repeated `Terminal injection failed`, deferred
  queue loops, and stale tty misses.

## Two-App Integration Reality (Voice Bridge + KWS app)

The integration is optional and env-driven via `voice_server.py`:

- `VOICE_KWS_INGEST_URL`
- `VOICE_KWS_FLUSH_URL`
- `VOICE_KWS_API_KEY`

Important: launchd keepalive plist (`com.tnf.voice-bridge-server`) currently
does not carry KWS env vars by default. If started by launchd only, tandem
forwarding may be off even when local transcription works.

## Restore Applied (this run)

File patched:

- `voice-bridge-package-20260325/bin/stream_watch.py`
- mirrored live: `~/bin/stream_watch.py`

Restore behavior:

1. Direct-tty is no longer default primary submit path.
2. Clipboard+keypress submit path remains primary in anchored terminal workflow.
3. Direct-tty can be enabled intentionally (opt-in):
   - `VOICE_TERMINAL_DIRECT_TTY_PRIMARY=1`
   - `VOICE_TERMINAL_DIRECT_TTY_BACKGROUND=1`
4. Stale-target retry loops hardened:
   - missing tty / target-not-found treated as non-retryable.
5. Retarget stale replay hardened:
   - queued chunks are dropped on target change.

## Current Intentional Defaults

- `VOICE_NO_FOCUS_STEAL=1`
- `VOICE_SUBMIT_KEY=enter,num-enter`
- `VOICE_TERMINAL_DIRECT_TTY_PRIMARY=0`
- `VOICE_TERMINAL_DIRECT_TTY_BACKGROUND=0`

## Recommended Controlled Validation

1. Start voice bridge.
2. Anchor once to active terminal target.
3. Speak 3 short phrases with pauses.
4. Confirm all 3 submit without manual Enter.
5. Speak during AI audio and confirm immediate interrupt.
6. Re-anchor to another terminal and confirm no queued replay from prior target.

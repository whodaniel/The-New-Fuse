# Voice Bridge Advanced Instructions

This guide covers power-user setup, tandem mode with the Audio Trigger KWS app,
and troubleshooting.

## 1) Tandem Mode: Local Injection + KWS/LLM Pipeline

Voice Bridge can now do both at once:

- Keep existing local destination injection (`~/.openclaw/voice_stream.txt` +
  `stream_watch.py`)
- Forward each transcript chunk to KWS API (`/v1/ingest/text`) and periodic
  flush (`/v1/flush`)

Set these before starting `voice`:

```bash
export VOICE_KWS_INGEST_URL='https://tnf-audio-trigger-kws-gateway.bizsynth.workers.dev/v1/ingest/text'
export VOICE_KWS_FLUSH_URL='https://tnf-audio-trigger-kws-gateway.bizsynth.workers.dev/v1/flush'
export VOICE_KWS_API_KEY='<your x-edge-api-key>'
```

Optional tuning:

```bash
export VOICE_KWS_STREAM_ID='voice_bridge_session_01'
export VOICE_KWS_FLUSH_INTERVAL_SECONDS='4.0'
export VOICE_KWS_INGEST_TIMEOUT_SECONDS='3.0'
export VOICE_KWS_FLUSH_TIMEOUT_SECONDS='20.0'
```

Then run:

```bash
voice
```

## 2) Verify Tandem Mode

When `voice_server.py` starts with KWS enabled, it prints:

- stream id
- ingest URL
- flush URL/interval

Check runtime state:

```bash
curl -sS http://127.0.0.1:50005/kws_state | jq .
```

Expected:

- `enabled: true`
- `has_api_key: true`
- your ingest/flush URLs and stream id

## 3) Behavior Notes

- Forwarding is async and non-blocking. UI/input responsiveness remains
  local-first.
- If KWS forwarding fails, local stream write still continues.
- Flush is throttled by `VOICE_KWS_FLUSH_INTERVAL_SECONDS`.

## 4) Troubleshooting

### No transcription target

- Run `voice-target-show`
- If unset, run `voice-target-here` or `voice-target-pick --delay 2`

### KWS forwarding disabled

- Ensure `VOICE_KWS_INGEST_URL` is set in the shell that launches `voice`
- Check `curl http://127.0.0.1:50005/kws_state`

### Edge auth errors (401/403)

- Verify `VOICE_KWS_API_KEY`
- Rotate key if needed and restart `voice`

### Browser mic issues

- Use Chrome/Edge
- Check mic permissions for browser and macOS

### Click-anchor issues

- Enable Terminal accessibility: System Settings -> Privacy & Security ->
  Accessibility
- Install `cliclick`: `brew install cliclick`

## 5) Operational Recommendation

- Keep this folder as source-of-truth package in repo.
- Treat `.dmg` as distribution artifact only.
- Rebuild `.dmg` from this folder whenever scripts change.

## 6) Optional AI Response Audio (Terminal Read-Aloud)

This package supports optional read-aloud for assistant responses shown in the
target Terminal tab.

Toggle it anytime:

```bash
voice-response-audio-toggle
```

Status/explicit control:

```bash
voice-response-audio-toggle --status
voice-response-audio-toggle --on
voice-response-audio-toggle --off
```

Hotkeys after install:

- `Option+r` toggles response audio
- `Ctrl+X`, then `r` (fallback)

Notes:

- It is OFF by default.
- The watcher starts with `voice`, but only speaks when the toggle is ON.
- Speech uses macOS `say` and sets `/tmp/ai_is_speaking` during playback for
  echo suppression compatibility with the existing voice bridge flow.

Optional tuning env vars:

```bash
export VOICE_RESPONSE_AUDIO_VOICE='Daniel'
export VOICE_RESPONSE_AUDIO_POLL_SECONDS='0.9'
export VOICE_RESPONSE_AUDIO_MAX_SPEAK_CHARS='420'
```

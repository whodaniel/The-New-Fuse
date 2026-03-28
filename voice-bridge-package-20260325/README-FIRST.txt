VOICE BRIDGE (One-Click Install)
================================

What this package gives you
- One-click browser activation for voice capture
- Cmd+Option+Click anchor targeting (choose exact insertion point)
- Batched auto-submit (natural speech, periodic flush)
- Mic toggle helper and target lock tools

Quick start (for a new user)
1) Double-click: Install Voice Bridge.command
2) Open a new Terminal tab/window
3) Run: voice
4) In browser, click: ACTIVATE BEAM
5) Hold Cmd+Option and click where text should go
6) Speak naturally

Hotkeys at zsh prompt
- Option+t: lock target to current terminal
- Option+m: mic toggle
- Option+a: capture frontmost app/window target
- Option+r: toggle AI response audio (terminal output read aloud)

Short commands
- vt  -> lock to current terminal
- vm  -> mic toggle
- va  -> capture app/window target
- vra -> toggle AI response audio

Notes
- macOS may ask for Accessibility permissions (Terminal)
- If click-anchor does not set target, enable Terminal in:
  System Settings -> Privacy & Security -> Accessibility
- AI response audio is optional and starts OFF by default
- Target lock is preserved across `voice` restarts (no auto-reset drift)
- AI response audio follows the same locked target context
- Focus-steal prevention is ON by default (`VOICE_NO_FOCUS_STEAL=1`), so
  Terminal target injection is skipped while another app (for example Finder)
  is frontmost.
- Cmd+Option-click in Terminal now captures a terminal tty lock (not only a
  screen point), improving deterministic routing for both transcription and
  response audio.

Optional: Forward transcripts to Audio Trigger KWS pipeline
- Set env vars before running `voice`:
  - `VOICE_KWS_INGEST_URL` (example: `https://tnf-audio-trigger-kws-gateway.bizsynth.workers.dev/v1/ingest/text`)
  - `VOICE_KWS_FLUSH_URL`  (example: `https://tnf-audio-trigger-kws-gateway.bizsynth.workers.dev/v1/flush`)
  - `VOICE_KWS_API_KEY`    (your `x-edge-api-key`)
  - Optional:
    - `VOICE_KWS_STREAM_ID`
    - `VOICE_KWS_FLUSH_INTERVAL_SECONDS` (default `4.0`)
    - `VOICE_KWS_INGEST_TIMEOUT_SECONDS` (default `3.0`)
    - `VOICE_KWS_FLUSH_TIMEOUT_SECONDS` (default `20.0`)

Advanced setup, tandem mode, and troubleshooting:
- `ADVANCED-INSTRUCTIONS.md`

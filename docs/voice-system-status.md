# Voice System Status

> **Updated:** 2026-06-22  
> **Canonical tooling:** `scripts/system/` (`TNF_VOICE_SYSTEM_DIR`)

## Architecture (working system)

```
Microphone / browser beam
    → listen (Whisper STT) → voice_server.py :50005
    → stream_watch.py (terminal injection + TTS path)
    → optional: audio-trigger-kws-mvp (KWS / rules / LLM)
    → optional: mini-omni :60808 (native chat TTS)
```

| Layer | Path | Role |
| ----- | ---- | ---- |
| Voice bridge | `scripts/system/` | STT ingest, echo suppression, target lock, cloud KWS forward |
| KWS + triggers | `apps/audio-trigger-kws-mvp/` | Rule engine, ingest API, mini-omni adapter |
| State | `The-New-Fuse/.voicebridge/` | Streams, targets, cloud env |
| Legacy package | *(removed)* | Was `voice-bridge-package-20260325/` — duplicate; use `scripts/system/` |

## Consolidation (2026-06-22)

- Live `~/bin/voice_server.py` and `voice-response-audio-watch.py` merged into `scripts/system/`
- `voicebridge-paths.sh` exports `TNF_VOICE_SYSTEM_DIR`
- `scripts/system/voice` launches from repo paths, not `$HOME/bin`
- `tnf` CLI resolves `scripts/system/` before `~/bin`
- Drift audit: `pnpm run voice:drift-audit`
- Optional PATH symlinks: `bash scripts/install-voice-bridge-symlinks.sh`

## Runtime checklist

| Check | Command | Healthy |
| ----- | ------- | ------- |
| Voice server | `curl -fsS http://127.0.0.1:50005/` | HTTP response (not connection refused) |
| Bridge status | `./tnf voice status` | Server UP, Mic ACTIVE |
| KWS cloud | `curl https://tnf-audio-trigger-kws-gateway.bizsynth.workers.dev/healthz` | `{"status":"ok"}` |
| KWS local | `curl http://127.0.0.1:43110/healthz` | When running `pnpm --filter @the-new-fuse/audio-trigger-kws-mvp serve` |
| mini-omni | `curl -I http://127.0.0.1:60808/chat` | When local TTS/chat backend is up |
| STT sidecar | `pgrep -fl listen` | When `tnf voice up --with-listen` or `listen` started |

## Full stack smoke test

```bash
# Terminal A — mini-omni (optional local TTS)
# cd ~/mini-omni && python3 server.py --ip 0.0.0.0 --port 60808 --device cpu

# Terminal B — KWS service (optional local ingest)
pnpm --filter @the-new-fuse/audio-trigger-kws-mvp serve

# Terminal C — voice bridge from repo
export TNF_VOICE_SYSTEM_DIR="$PWD/scripts/system"
bash scripts/system/voice --profile main

# Or via CLI
./tnf voice up --with-listen --profile main
```

## Drift policy

**Canonical:** `scripts/system/`  
**Fallback:** `~/bin` or `~/.tnf/bin` symlinks (should point at canonical)  
**Do not use:** duplicate emergency copies under `~/app` or `~/apps`

Run before releases:

```bash
bash scripts/audit/voice-drift-audit.sh
```

## Chunk batching (STT → Cursor)

Two stages control how speech becomes messages:

| Stage | Script | What it does |
| ----- | ------ | ------------- |
| STT segment | `listen` | Ends an utterance after `LISTEN_SILENCE_END_SECONDS` (default **2.8s**) |
| Inject batch | `stream_watch.py` | Merges stream lines before typing/submitting |

**Default flush policy** (`stream_watch.py`):

| Mode | When | Idle | Max window | Min chars |
| ---- | ---- | ---- | ---------- | --------- |
| Default | Terminal, most apps | 3.5s | 18s | 20 |
| Chat | Cursor, Windsurf, etc. | 5.0s | 25s | 36 |

Chat mode activates when the locked target app/window matches `VOICE_CHAT_APP_HINTS`
(default includes `cursor`, `composer`, `chatgpt`, `claude`).

Override via env:

```bash
export VOICE_IDLE_FLUSH_SECONDS=4.0
export VOICE_MAX_FLUSH_SECONDS=20.0
export VOICE_MIN_FLUSH_CHARS=30
export VOICE_CHAT_IDLE_FLUSH_SECONDS=6.0
export LISTEN_SILENCE_END_SECONDS=3.2
```

For Cursor chat, anchor the **Cursor app** (not Terminal tty) with Enter off:

```bash
bash scripts/system/voice-target-pick --profile main --delay 5 --no-enter
```

Restart the bridge after changes: `./tnf voice down && ./tnf voice up --with-listen --profile main`

## Pause / resume the beam

Stop mic capture and injection without tearing down the voice server:

```bash
./tnf voice pause --profile main    # pause
./tnf voice resume --profile main   # resume
./tnf voice mic toggle              # flip pause state
```

In the beam browser UI (`http://localhost:50005`), click **ACTIVATE BEAM** to start; click again (**BEAM ACTIVE — CLICK TO PAUSE**) to pause; click once more to resume.

While paused: browser STT stops, Whisper `listen` idles, `stream_watch` skips injection.

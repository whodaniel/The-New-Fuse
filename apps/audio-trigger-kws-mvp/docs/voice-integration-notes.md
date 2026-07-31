# Voice System Integration Notes

## Connection to audio-trigger-kws-mvp

The voice system (`tnf voice`) integrates with the audio-trigger-kws-mvp service
through the KWS (Keyword Spotting) gateway.

### Integration Points

#### 1. KWS Ingest Endpoint

- **Voice Server Config**: `VOICE_KWS_INGEST_URL`
- **Default**:
  `https://tnf-audio-trigger-kws-gateway.bizsynth.workers.dev/v1/ingest/text`
- **Purpose**: Forwards transcriptions to KWS for trigger detection

#### 2. API Endpoint

```bash
POST /v1/ingest/text
Headers:
  x-edge-api-key: <INGEST_API_KEY>
  content-type: application/json
Body:
  {
    "streamId": "voice_bridge_<hostname>_<pid>",
    "utterance": "<transcribed text>"
  }
```

#### 3. Environment Variables

In `voice_server.py`:

- `KWS_INGEST_URL` - Endpoint for forwarding transcriptions
- `KWS_FLUSH_URL` - Endpoint for flushing buffered data
- `KWS_API_KEY` - Authentication key
- `KWS_STREAM_ID` - Unique stream identifier
- `KWS_INGEST_TIMEOUT_SECONDS` - Request timeout (default: 3.0)
- `KWS_FLUSH_TIMEOUT_SECONDS` - Flush timeout (default: 20.0)
- `KWS_FLUSH_INTERVAL_SECONDS` - Auto-flush interval (default: 4.0)

In `audio-trigger-kws-mvp`:

- `REQUIRE_INGEST_AUTH` - Enable authentication
- `INGEST_API_KEY` - API key for ingest endpoints
- `MINI_OMNI_ENABLED` - Enable mini-omni backend
- `MINI_OMNI_API_URL` - mini-omni server URL

## Multi-agent destinations (TNF feature)

Voice inject is **not** Cursor-specific. Destinations:

1. **Cmd+Option+Click** — any app/tab (primary retarget).
2. **`voice-target-agent --prefer any`** — auto-lock to a live agent tty
   (`cursor-agent`, `claude`, `codex`, `gemini`, `tnf agent`, `aider`, …).
3. **KWS AgentRouter** (`apps/audio-trigger-kws-mvp`) — keyword callsigns
   (`echo`, `pulse`, …) for named agents once TTYs are registered.

Echo suppression follows the KWS pattern: while TTS is speaking (and briefly
after), mic/STT must not re-ingest speaker audio as a user utterance.

```
User Speech → Whisper Transcription → voice_server.py → KWS Gateway → audio-trigger-kws-mvp
```

From `tnf voice status`:

```
Cloud forwarding: ON
Ingest URL: https://tnf-audio-trigger-kws-gateway.bizsynth.workers.dev/v1/ingest/text
```

### Recommendations

1. **Ensure API key is set** in both systems:
   - Voice: `VOICE_KWS_API_KEY` or `KWS_API_KEY`
   - KWS: `INGEST_API_KEY`

2. **Monitor forwarding** with logs:
   - Voice: `/tmp/voice_server.log`
   - KWS: Check service logs for received utterances

3. **Test integration**:

   ```bash
   # Start voice system
   tnf voice start

   # Speak test phrase
   # Check voice server logs for "KWS_INGEST" events

   # Verify KWS received it
   curl -X GET http://127.0.0.1:43110/v1/events/packages
   ```

4. **Sync interrupt behavior**:
   - The interrupt fix in `voice_server.py` ensures user input is processed
   - KWS should also be aware of AI speaking state to avoid trigger loops

### Architecture Flow

```
┌─────────────────┐
│  Microphone     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  listen script  │ (Whisper transcription)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ voice_server.py │ (Echo suppression, interrupt)
└────────┬────────┘
         │
         ├──────────────────────┐
         │                      │
         ▼                      ▼
┌─────────────────┐   ┌─────────────────────┐
│  STREAM_FILE    │   │  KWS Gateway        │
│  (local inject) │   │  (trigger detection)│
└─────────────────┘   └──────────┬──────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │ audio-trigger-kws   │
                      │ (rule engine, LLM)  │
                      └─────────────────────┘
```

### Next Steps

1. Verify KWS gateway is receiving transcriptions from voice system
2. Ensure interrupt state is communicated to KWS (avoid triggers during AI
   speech)
3. Test end-to-end: voice → KWS → rule trigger → LLM response
4. Document any additional configuration needed for production deployment

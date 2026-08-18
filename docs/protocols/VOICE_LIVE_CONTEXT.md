# Voice Live Context

Status: ACTIVE  
Protocol ID: `TNF_VOICE_LIVE_CONTEXT`  
Category: **Live Context** (TNF Voice — situational awareness for ground input)

## What this category is

**Live Context** is the situational envelope attached to a voice ground-input
turn so the receiving agent knows _what is happening right now_, not only _what
was said_.

It is **not**:

| Nearby concept          | Why it’s different                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| **Who-is-who**          | Identity glossary (Claude ≠ Hermes ≠ OpenClaw). Static labels + optional live roster snapshot. |
| **Chronicle / `[↑tN]`** | Turn sequence and short thread continuity.                                                     |
| **Inky**                | Audio front door / TTS persona — not situational state.                                        |
| **Turn Zero**           | Session boot / mandate stack — not per-utterance situation.                                    |
| **Beam target**         | Where speech is injected; Live Context _includes_ the current target as one field.             |

## Payload (canonical)

Written on each anchored voice inject to:

`.voicebridge/chronicle-inject-context.json`

| Field                    | Source                           | Role                      |
| ------------------------ | -------------------------------- | ------------------------- |
| `turn` / `user_text`     | Chronicle                        | This utterance            |
| `thread_hint`            | Recent chronicle summaries       | Conversational continuity |
| `situation.voice_target` | `voice_target.json`              | Beam lock (app, tty, pid) |
| `situation.live_agents`  | `agent_who_is_who.json` → `live` | Who is up _now_           |
| `situation.who_speech`   | who-is-who speech line           | Optional spoken roster    |

## Consumers

1. **Writer:** `scripts/system/voice_chronicle.py` → `write_inject_context`
   (called from `build_anchored_voice_prompt` / `stream_watch`)
2. **TNF CLI:** `loadVoiceGroundSituation` in `packages/tnf-cli/src/cli.ts` —
   prepends a short situation block before the model turn
3. **Cursor / other agents:** may read the same sidecar without bloating the
   injected `[↑tN]` line

## Design rule

Keep the injected text **minimal** (`[↑tN] …`). Put relative world-state in the
**sidecar**; attach a compact situation block only when the consumer needs
contextual understanding.

## Related

- `docs/protocols/AGENT_WHO_IS_WHO.md` — identity + live roster
- `.voicebridge/voice_target.json` — beam destination
- `scripts/system/tnf-agent-who-is-who.py` — refresh live agents
- `scripts/system/voice-beam-watchdog.sh` — beam lifecycle management
- `scripts/system/voice_server.py` — voice server REST API

## Configuration

The voice beam is **OFF by default**. To enable audio response:
- Set `VOICE_RESPONSE_AUDIO_DEFAULT_ON=1` in the environment
- Or activate via the browser UI with the "ACTIVATE BEAM" button
- Or run `voice-response-audio-toggle --profile <profile>`

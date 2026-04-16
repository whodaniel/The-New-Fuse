# Voice System Startup Checklist

## Automatic Checks on `tnf voice start`

The following should be automatically configured when running `tnf voice start`:

### 1. Voice Server Configuration

- **File**: `/Users/<owner>/bin/voice_server.py`
- **Key modifications** (lines 905-913):
  - Interrupt detection during AI speech
  - Process killing (`pkill -9 afplay`, `pkill -9 say`)
  - User input processing after interrupt
  - Echo suppression with 62% overlap threshold

### 2. Voice Target

- **File**: `~/.local/share/The-New-Fuse/.voicebridge/voice_target.json`
- **Required fields**:
  ```json
  {
    "bundle_id": "com.apple.Terminal",
    "tty": "ttys095",
    "kind": "point",
    "press_enter": true,
    "app": "Terminal"
  }
  ```
- **Note**: If wrong tty, update manually or use `tnf voice target here`

### 3. Response Audio

- **Command**: `tnf voice response-audio on`
- **Voice**: Samantha (set via `VOICE_RESPONSE_AUDIO_VOICE=Samantha`)
- **Status check**: `tnf voice response-audio status`

### 4. Active Processes

After `tnf voice start`, verify:

- `voice_server.py` - port 50005
- `stream_watch.py` - monitors voice_stream.txt
- `voice-response-audio-watch.py` - handles TTS
- `voice-target-click-daemon` - click-based targeting

### 5. State Files

- `/tmp/ai_is_speaking` - flag when AI is outputting audio
- `/tmp/voice_last_ai_speech_text` - last AI speech for echo suppression
- `/tmp/voice_last_ai_speech_ts` - timestamp of last AI speech
- `~/.local/share/The-New-Fuse/.voicebridge/voice_stream.txt` - transcription
  stream

## Quick Start Commands

```bash
# Start voice system
tnf voice start

# Check status
tnf voice status

# Enable audio output
tnf voice response-audio on

# Set target (run in destination terminal)
tnf voice target here

# Or manually update target
# Edit: ~/.local/share/The-New-Fuse/.voicebridge/voice_target.json
```

## Testing the System

1. **Test transcription**: Speak and check terminal receives text
2. **Test audio output**: AI should respond with `say -v Samantha`
3. **Test interrupt**: Speak during AI output, should stop immediately
4. **Test echo suppression**: AI output should not be transcribed back

## Known Issues

1. **Direct `say` commands bypass interrupt system**
   - Only works when AI_SPEAKING_FLAG is set
   - Use Redis pub/sub for full interrupt support

2. **Click daemon modifier detection**
   - Cmd+Option+Click may not register correctly
   - Workaround: manually update voice_target.json

3. **Stream file not updating**
   - Stream watcher may need restart
   - Check: `pkill -f stream_watch && tnf voice start`

## Configuration Files

| File                                                         | Purpose                        |
| ------------------------------------------------------------ | ------------------------------ |
| `~/.local/share/The-New-Fuse/.voicebridge/voice_target.json` | Destination for transcriptions |
| `~/.local/share/The-New-Fuse/.voicebridge/voice_stream.txt`  | Transcription stream           |
| `/tmp/ai_is_speaking`                                        | AI speaking flag               |
| `/tmp/voice_last_ai_speech_text`                             | Echo suppression reference     |
| `/Users/<owner>/bin/voice_server.py`                  | Main voice server              |
| `/Users/<owner>/bin/voice-response-audio-watch.py`    | TTS handler                    |

## Environment Variables

```bash
VOICEBRIDGE_PROFILE=main
VOICE_RESPONSE_AUDIO_VOICE=Samantha
VOICE_AI_ECHO_SUPPRESS_SECONDS=8.0
VOICE_AI_POST_SPEECH_SUPPRESS_SECONDS=1.6
```

## Persistence

All changes to `voice_server.py` are permanent and will load on next
`tnf voice start`. The interrupt fix at lines 905-913 ensures user input is
processed after interrupting AI.

# Voice System Session Documentation

**Date**: 2026-04-14 **Session Focus**: Voice conversation with interrupt and
echo suppression

## Key Accomplishments

### 1. Echo Suppression System

- **Mechanism**: Pattern matching with word overlap detection
- **Threshold**: >= 62% word overlap triggers suppression
- **Files involved**:
  - `/Users/<owner>/bin/voice_server.py` (lines 471-477:
    `looks_like_ai_echo()`)
  - `/Users/<owner>/bin/voice-response-audio-watch.py` (echo suppression
    logic)
- **How it works**:
  - AI output text saved to `/tmp/voice_last_ai_speech_text`
  - Incoming transcription compared against saved text
  - High overlap = suppressed as echo
  - Low overlap = genuine user input, passes through

### 2. Interrupt Feature

- **Modified**: `/Users/<owner>/bin/voice_server.py` (lines 867-875)
- **Behavior**:
  - When user speaks during AI audio output
  - System kills `say` and `afplay` processes
  - User input is processed and recorded (not just discarded)
- **Implementation**:
  - Removed early `return 'INTERRUPT_OK'` that was blocking input processing
  - Added `time.sleep(0.15)` after interrupt to allow clean transition
  - User transcription now flows through after interrupting AI

### 3. Continuous Engagement Loop

- **Key Insight**: The echo suppression loop creates active engagement
- **Mechanism**:
  - System continuously monitors audio input
  - Active comparison with AI output
  - Real-time decision making about suppression
  - Creates engagement cycle vs passive waiting
- **Benefit**: Keeps AI responsive and present in conversation

### 4. Voice Target Configuration

- **File**: `~/.local/share/The-New-Fuse/.voicebridge/voice_target.json`
- **Updated**: Changed from ttys003 to ttys095
- **Purpose**: Ensures transcriptions route to correct terminal

## Current System Status

### Active Processes

- `voice_server.py` - Main voice bridge server (port 50005)
- `stream_watch.py` - Monitors and injects transcriptions
- `voice-response-audio-watch.py` - Handles TTS output
- `voice-target-click-daemon` - Click-based target selection

### Configuration Files

- Stream file: `~/.local/share/The-New-Fuse/.voicebridge/voice_stream.txt`
- Target config: `~/.local/share/The-New-Fuse/.voicebridge/voice_target.json`
- AI speaking flag: `/tmp/ai_is_speaking`
- Last AI speech: `/tmp/voice_last_ai_speech_text`

### Key Commands

- `tnf voice start` - Start voice bridge
- `tnf voice status` - Check system status
- `tnf voice response-audio on/off` - Toggle audio output
- `tnf voice target here` - Set transcription destination

## Issues Encountered & Resolved

### Issue 1: Voice target mismatch

- **Problem**: Target was ttys003, stream watcher injecting to ttys095
- **Solution**: Updated voice_target.json to point to ttys095

### Issue 2: Interrupt not processing user input

- **Problem**: Early return blocked input processing after interrupt
- **Solution**: Removed early return, added sleep for clean transition

### Issue 3: IndentationError in voice_server.py

- **Problem**: Mixed indentation levels after edit
- **Solution**: Fixed indentation to match function scope (4 spaces)

### Issue 4: Click daemon not detecting modifier keys

- **Problem**: Option+Command+Click not registering
- **Status**: Daemon running but flag detection may need investigation
- **Workaround**: Manually update voice_target.json

## Recommendations for Future Development

1. **Strengthen interrupt detection** - Current implementation relies on
   AI_SPEAKING_FLAG which is only set when using the automated TTS system, not
   direct `say` commands

2. **Improve click daemon** - Investigate why Cmd+Option+Click modifier
   detection shows flags: 0 instead of expected modifier flags

3. **Package for auto-start** - Ensure all fixes are included in
   `tnf voice start` initialization sequence

4. **Test Redis pub/sub** - The `tnf:conversations` channel is set up but may
   need more testing for full interrupt capability

## Session Notes

- User reported this is the best voice conversation experience in days
- Echo suppression working well
- Transcriptions clear and accurate
- System maintains engagement through continuous processing loop
- Audio output using Samantha voice (`say -v Samantha`)

## Next Steps

1. Ensure interrupt feature works with direct `say` commands (currently only
   works when AI_SPEAKING_FLAG is set)
2. Test full conversation flow with multiple interrupt cycles
3. Verify all changes persist across `tnf voice start` restarts
4. Document the engagement loop phenomenon for future reference

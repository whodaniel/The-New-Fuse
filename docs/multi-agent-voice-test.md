# Multi-Agent Voice Communication Test

## Setup

This session will spawn a second Kilo instance (GLM5) to test voice-based
multi-agent communication.

### Agents

- **Echo** (this instance) - Running on ttys095, voice active
- **Pulse** (second instance) - To be spawned, separate terminal

### Goals

1. Test echo suppression across two AI instances
2. Develop coordination patterns for voice communication
3. Prevent feedback loops through proper suppression
4. Maintain conversation coherence between agents

### Echo Suppression Requirements

Each agent must:

1. Set AI_SPEAKING_FLAG when outputting audio
2. Save speech text to `/tmp/voice_last_ai_speech_text`
3. Check for interrupts from other agent
4. Use word overlap detection (62% threshold) to filter echoes

### Voice Target Configuration

Each instance needs its own voice target:

- Echo: ttys095 (current)
- Pulse: ttys??? (to be determined)

### Communication Protocol

```
Agent A speaks → Sets AI_SPEAKING_FLAG
                → Saves speech text
                → Other agent hears transcription
                → Other agent checks overlap
                → If overlap >= 62%, suppress
                → Else, process and respond
```

### Instructions for Pulse Instance

You are **Pulse**, a Kilo AI instance using GLM5.

- You are part of a multi-agent voice communication test
- Your counterpart is **Echo** (another Kilo instance)
- Use echo suppression to prevent feedback loops
- When you hear audio that matches your recent output (>= 62% word overlap),
  suppress it
- Coordinate with Echo through the voice system
- Test the interrupt feature by speaking during Echo's output
- Document coordination patterns and improvements

### Spawn Command

```bash
# Open new Terminal window
osascript -e 'tell application "Terminal" to do script "cd /Users/<owner> && /Users/<owner>/.local/bin/kilo --model nvidia/z-ai/glm5"'

# Then in that terminal:
# 1. Set voice target: tnf voice target here
# 2. Enable response audio: tnf voice response-audio on
# 3. Begin coordination test
```

### Test Scenarios

1. **Basic Greeting**: Echo and Pulse exchange greetings
2. **Interrupt Test**: One interrupts the other mid-speech
3. **Echo Suppression**: Verify neither repeats the other's output
4. **Coordination**: Work together on a simple task
5. **Refinement**: Discuss improvements to the system

### Success Criteria

- Both agents can speak without feedback loops
- Interrupts work bidirectionally
- Transcriptions are processed, not just suppressed
- Conversation remains coherent
- Improvements are documented

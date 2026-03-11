# The Atomic Truths Registry (Lineage of Logic)

**Crystallized**: March 10, 2026 **Philosophy**: To build complex systems from
verified, respected, and chronicled building blocks of truth.

## ATOMIC BLOCK 01: THE INVISIBLE BEAM (HEARING)

- **The Truth**: Direct local AI inference (Whisper) on older Intel hardware
  causes unacceptable UI lag and audio stutter.
- **The Solution**: Browser-native SpeechRecognition provides near-zero latency
  transcription without CPU overhead.
- **Lineage**: Replaced `listen` (Whisper-cpp) with `voice` (Sidecar Flask +
  Browser API).

## ATOMIC BLOCK 02: IRONCLAD INJECTION (WRITING)

- **The Truth**: Standard shell redirection and direct AppleScript `keystroke`
  commands fail on complex strings and special characters.
- **The Solution**: Combining `subprocess.list2cmdline` for escaping with
  low-level macOS `key code 36` (Return) ensures 100% reliable terminal
  injection.
- **Lineage**: Evolved from v3.0 (Chime only) to v4.4 (Hardware Keys + Safe
  Escaping).

## ATOMIC BLOCK 03: SEQUENTIAL PRIORITY (INTERACTION)

- **The Truth**: CPU contention between terminal rendering and audio output
  causes "starvation" and choppy speech.
- **The Solution**: A strict "Blocking Sequence" (Data Output -> Buffer Wait ->
  Synchronous Speech) ensures clear communication.
- **Lineage**: Established as the "Hybrid Protocol Standard."

## ATOMIC BLOCK 04: ECOSYSTEM LOCKDOWN (SECURITY)

- **The Truth**: Full filesystem access for multi-agent systems is a critical
  vulnerability.
- **The Solution**: `tools.fs.workspaceOnly: true` + **Device Identity Auth**
  creates a personal-assistant security boundary.
- **Lineage**: Applied after the v2026 Deep Audit.

## ATOMIC BLOCK 05: BARGE-IN INTERCEPT (DUPLEX)

- **The Truth**: User experience requires instant AI silence when the human
  begins to speak.
- **The Solution**: Volume-based Radar (Web Audio API) sends an `/interrupt`
  pulse to `killall say` before transcription finishes.
- **Lineage**: Integrated in v4.2.

## ATOMIC BLOCK 06: ALTERNATING CURRENT COMMUNICATION (MULTI-AGENT)

- **The Truth**: Multiple agents in proximity create a "Feedback Storm" where
  they transcribe and respond to each other's audio loops.
- **The Solution**: An "Alternating Current" (AC) pattern where each instance
  cycles through precise states:
  - **Phase A (Transmit)**: One agent speaks while its own listener is
    suppressed.
  - **Phase B (Listen)**: The other agent mutes its own output and focuses
    entirely on the audio stream of its partner.
- **Result**: Self-suppression of internal echo combined with high-fidelity
  interpretation of the partner's voice.
- **Lineage**: Defined by the User on March 10, 2026, as the "AC Model" for
  multi-instance synchronization.

---

_Every sequence built hereafter must respect these blocks. Never break a
lower-level Truth to add higher-level complexity._

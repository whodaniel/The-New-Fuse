# Bridge Report: tnf-mini-omni-voice-loop

Date: 2026-03-23  
Status: IMPLEMENTED

## Objective

Integrate Mini-Omni voice loop execution into TNF’s bridge framework with a
repeatable contract and smoke validation path.

## What Was Added

1. Bridge contract:
   - `docs/protocols/bridges/tnf-mini-omni-voice-loop.yml`
2. Relay-core integration service:
   - `packages/relay-core/src/services/MiniOmniBridgeService.ts`
   - export wired via `packages/relay-core/src/index.ts`
3. Protocol smoke command:
   - `scripts/protocols/mini-omni-bridge-smoke.cjs`

## Validation Notes

1. Relay-core type-check should include the new bridge service:
   - `pnpm --filter @the-new-fuse/relay-core run type-check`
2. Smoke command validates endpoint + streaming bytes:
   - `node scripts/protocols/mini-omni-bridge-smoke.cjs --json`
3. Expected pass condition:
   - `ok=true`
   - `statusCode=200`
   - `bytes > 0`

## Operational Notes

1. Default endpoint is `http://127.0.0.1:60808/chat`.
2. Default sample discovery checks:
   - `MINI_OMNI_SAMPLE_WAV`
   - `$HOME/mini-omni/data/samples/output1.wav`
3. Use `--output <path>` to persist returned audio stream for audit/debug.

## 2026-03-26 Runtime Hardening Update

1. Voice bridge startup now preserves existing destination lock instead of
   always resetting to the current `voice` tab.
2. Response audio watcher now supports explicit source modes and defaults to
   `target` so spoken AI output is tied to the same locked interaction target.
3. Added extra watcher diagnostics (`/tmp/voice_response_audio.log`) and AI tty
   awareness to reduce misrouting and improve live debugging.
4. Added `VOICE_NO_FOCUS_STEAL` guard in `stream_watch.py` (default on) to
   prevent Terminal target injection from stealing focus while working in other
   apps like Finder.
5. Updated click-anchor daemon so Cmd+Option-click in Terminal can emit a
   terminal tty lock, improving deterministic handoff between transcript input
   and response-audio output.
6. Added a Codex session-log fallback in `voice-response-audio-watch.py` for
   cases where Terminal `contents` is empty/blank on Codex TUI tabs; the
   fallback remains anchored to the same locked target tty.
7. Added backlog protection so response audio does not replay old session text
   when the watcher restarts; it starts at end-of-file and speaks only new
   assistant output.
8. Session fallback now binds by active Codex PID (`lsof` on the target tty)
   before using timestamp heuristics, reducing cross-session drift and keeping
   audio anchored to the selected terminal interaction.

## 2026-03-26 Echo/Watcher Stability Repair

1. Fixed echo-filter normalization in `voice_server.py`:
   - corrected regex escaping so whitespace normalization works as intended for
     partial phrase comparisons.
2. Replaced `pgrep -f` watcher checks with process-table scanning in
   `voice_server.py`:
   - prevents false-positive self matches that caused `/activate` to report
     watchers as already running when they were not.
3. Verified live activation now starts missing workers deterministically:
   - `POST /activate -> {"ok": true, "started": ["stream_watch", "response_audio_watch"]}`
4. Verified loopback suppression on both exact and partial phrase replay:
   - `/send` returned `ECHO_FILTERED` for exact and partial overlaps with
     `voice_last_ai_spoken.json`.
5. Confirmed runtime process set after restart:
   - `voice_server.py`
   - `stream_watch.py`
   - `voice-response-audio-watch.py`
   - `voice-target-click-daemon`
6. Fixed re-anchor typing outage caused by macOS keystroke permission failures
   (`System Events` / `osascript` error 1002):
   - terminal target injection now uses Terminal-native
     `do script "<text>" in <locked tab>` delivery, avoiding `System Events`.
7. Direct `/dev/ttys*` writes were tested and then replaced because they can
   render text without reliable submit semantics in this workflow.
8. Verified lock-target delivery resumed on `ttys009` with no new
   `Terminal injection failed` events from the old keystroke path.
9. Stabilized Terminal `do script` injection by moving transcript payload into a
   temp file and reading it inside AppleScript; this avoids parser failures from
   embedded punctuation/quote content in live transcription text.
10. Strengthened echo suppression by storing recent AI-spoken history and
    checking multi-candidate token/run overlap, reducing AI self-echo re-entry
    into the transcript path.
11. Added explicit submit pulse on the locked terminal tty after injection:
    - writes carriage-return directly to `/dev/ttys*` when `press_enter=true` so
      auto-submit does not depend on UI keystroke simulation.
12. Refined terminal submit path again:
    - payload now appends `ASCII character 13` inline before `do script` when
      `press_enter=true`, replacing external tty pulse behavior.
13. Added reliable return-key strategy for terminal targets:
    - primary: `cliclick kp:return` when the locked terminal tab is frontmost.
    - fallback: brief focus-hop to locked terminal tab, send `cliclick` Return,
      then restore prior frontmost app when `VOICE_NO_FOCUS_STEAL=1`.
14. Terminal auto-submit path simplified for locked terminal tabs:
    - `stream_watch.py` now submits in a single Terminal-native call:
      `do script payloadText in foundTab` with inline `ASCII character 13` when
      `press_enter=true`.
    - removed synthetic submit dependence on `cliclick`/focus-hop for this path.
15. Added bridge watcher auto-heal loop in `voice_server.py`:
    - startup reconciliation runs `ensure_background_bridge()` automatically.
    - daemon health loop re-checks every 6s (configurable via
      `VOICE_BRIDGE_HEALTH_INTERVAL_SECONDS`) and restarts missing watchers.
16. Hardened TTS echo suppression again:
    - added normalized similarity checks (`difflib.SequenceMatcher`) for near
      matches and short-phrase overlap while AI speech is active.
    - reduces AI self-transcription leakage into `/send` write path.

## 2026-03-26 Submit Stability + Terminal Coalesce

1. Replaced slow idle-window batching with low-latency terminal coalescing:
   - for `kind=terminal` + `press_enter=true`, `stream_watch.py` now batches
     short bursts in a small window (`VOICE_TERMINAL_COALESCE_SECONDS`, default
     `0.55s`) and submits promptly.
   - log marker: `Flushing ... [terminal-coalesce]`.
2. Preserved batching for non-terminal destinations with safety guard:
   - added pending chunk cap (`VOICE_MAX_PENDING_CHUNKS`, default `10`) to avoid
     runaway buffered payloads.
3. Kept deterministic submit key behavior:
   - terminal path continues using `cliclick kp:<submit-key>` with current
     runtime default `VOICE_SUBMIT_KEY=num-enter`.
4. Verified live behavior on locked target `ttys008`:
   - plain speech now auto-submits without manual Enter while reducing
     scroll-jump churn from per-fragment sends.

## 2026-03-26 Audio Return + Single-Instance Reset

1. Restored audible responses for live debugging sessions:
   - `voice-response-audio-watch.py` now supports speaking assistant
     `commentary` phase output (toggle:
     `VOICE_RESPONSE_AUDIO_INCLUDE_COMMENTARY`, default `1`).
2. Repaired duplicate-server race:
   - found two concurrent `voice_server.py` instances competing for port `50005`
     and intermittently destabilizing the input path.
   - performed clean reset to one server instance, then re-activated bridge
     helpers (`stream_watch` + `voice-response-audio-watch`).
3. Verified post-reset runtime:
   - `voice_server.py` single instance on `127.0.0.1:50005`.
   - `stream_watch.py` processing transcript lines on locked `ttys008`.
   - `voice-response-audio-watch.py` logging `spoken from ttys008 ...` events.

## 2026-03-26 Interrupt Priority Fix

1. Fixed cut-through regression in `/send`:
   - interrupt handling now executes before echo filtering.
   - this prevents false-positive `FILTER_ECHO` matches from blocking user
     interruption while AI audio is speaking.
2. Behavior after fix:
   - when `/tmp/ai_is_speaking` exists and user speech arrives, server kills
     `say/afplay`, clears the speaking flag, then continues normal ingest path.
3. Verified with live smoke:
   - `INTERRUPT` log emitted.
   - AI speaking process stopped.
   - user phrase persisted (`WRITING: USER_INTERRUPT_TEST_<ts>`).

## 2026-03-26 Turn-Taking Hardening

1. Added user-priority speech timestamp from ingest path:
   - `/send` now records each user speech event timestamp
     (`/tmp/voice_last_user_speech_ts`) before filtering.
2. Added response-audio user holdoff gate:
   - `voice-response-audio-watch.py` defers AI speech for
     `VOICE_RESPONSE_AUDIO_USER_HOLDOFF_SECONDS` (default `2.2s`) after user
     speech.
   - log marker: `user-turn holdoff active (...)`.
3. Reduced AI overtalk risk during live debugging:
   - changed default `VOICE_RESPONSE_AUDIO_INCLUDE_COMMENTARY` to `0` so
     commentary chatter is muted unless explicitly enabled.
4. Verified runtime state post-hardening:
   - single watcher process under `voice_server.py` parent.
   - holdoff marker observed after user speech.
   - no immediate commentary replay after watcher restart.

## 2026-03-26 Restart-Resume Reliability

1. Added persistent stream offset checkpointing in `stream_watch.py`:
   - state file: `~/.openclaw/voice_stream.offset.json` (`inode` + `offset`).
   - watcher resumes from the last unread position when restarted on the same
     stream file/inode.
2. Why this matters:
   - prevents line loss during brief watcher restarts (previous behavior started
     at EOF and could skip in-between transcript lines).
3. Verification:
   - queued lines written while watcher was down were recovered after restart
     and injected: `RESTART_RESUME2_A_<ts> RESTART_RESUME2_B_<ts>`.

## 2026-03-26 Live Reliability Tuning (Low-Latency + Filter Scope)

1. Reduced perceived entry lag:
   - `stream_watch.py` terminal coalesce window lowered to `0.14s` default.
   - terminal max flush window lowered to `0.70s`.
2. Reduced false-drop risk for user speech:
   - `voice_server.py` echo filter now defaults to running only while AI is
     actively speaking (`VOICE_ECHO_FILTER_ONLY_WHILE_SPEAKING=1`).
   - avoids broad historical echo suppression when AI is not currently talking.
3. Live verification marker:
   - `/send` marker `LIVE_FIX_MARK_<ts>` produced `WRITING` and then terminal
     injection in `stream_watch` logs.

### 2026-03-26 Runtime Stability Patch (Submit + Retry)

- Updated `stream_watch.py` submit behavior to prefer `enter` and fall back to
  `num-enter` (`VOICE_SUBMIT_KEY` now supports comma-separated keys, default
  `enter,num-enter`).
- Added retry-safe buffering in `stream_watch.py` so transient injection
  failures (for example target not frontmost under `VOICE_NO_FOCUS_STEAL`) keep
  chunks queued instead of dropping them.
- Verified live runtime after restart on locked `ttys008` with submit logs
  showing `enter:key-enter`.

### 2026-03-26 No-Focus Background Inject Patch

- `stream_watch.py` terminal path now supports no-focus background delivery:
  - when lock target tty is not frontmost and `VOICE_NO_FOCUS_STEAL=1`, injects
    directly to `/dev/<tty>` and appends CR if `press_enter=true`.
- This eliminates skip-only behavior in background focus scenarios while
  preserving no focus-steal policy.
- Verified on locked `ttys008` with log signal:
  - `mode=direct-tty; enter:inline-cr`
- Verified landing in mapped Codex session stream (`mapped_found=1`).

### 2026-03-26 Deterministic Terminal + Echo Hardening

- `stream_watch.py` terminal mode now attempts direct `/dev/<tty>` injection
  first for all terminal-target sends (foreground/background), with inline `CR`
  when `press_enter=true`.
- UI keypress injection remains as fallback only if direct tty write fails.
- This removes focus dependency and prevents no-focus-steal skip loops from
  blocking delivery.
- `voice_server.py` echo filter now includes a short post-speech grace window
  (`VOICE_ECHO_RECENT_GRACE_SECONDS`, default `10s`) so trailing AI TTS loopback
  is filtered after `/tmp/ai_is_speaking` is cleared.
- Verified in runtime:
  - stream log shows only `mode=direct-tty; enter:inline-cr` after latest
    watcher restart.
  - synthetic echo test returned `ECHO_FILTERED`, while unrelated dictation
    still returns `OK` and beams.

## 2026-03-27 Restoration (Known-Good Runtime Rebuild)

1. Re-established clean single-instance runtime under
   `com.tnf.voice-bridge-server`:
   - one `voice_server.py`
   - one `stream_watch.py`
   - one `voice-response-audio-watch.py`
2. Disabled click-daemon auto-heal thrash in launchd profile:
   - `VOICE_CLICK_DAEMON_AUTO_START=0`
3. Restored stable terminal submit primary path:
   - frontmost terminal path remains `clipboard-keypress` + submit key fallback
     (`enter,num-enter`).
4. Added deterministic no-focus background fallback for terminal lock targets:
   - `stream_watch.py` now uses `do script` fallback when target terminal is not
     frontmost and `VOICE_NO_FOCUS_STEAL=1`.
   - env control: `VOICE_TERMINAL_DO_SCRIPT_BACKGROUND=1` (default on).
5. Verified fresh runtime probes:
   - frontmost marker injects as `mode=clipboard-keypress; enter:key-enter`.
   - background marker injects as `mode=do-script-bg` (no focus steal).
6. Re-verified interrupt cut-through:
   - user speech during active AI audio kills `say` and clears
     `/tmp/ai_is_speaking`.
7. KWS status remains intentionally disabled until key is provided:
   - `VOICE_KWS_INGEST_URL`/`VOICE_KWS_FLUSH_URL` can be configured,
   - but `VOICE_KWS_API_KEY` is still required for production gateway auth.

## Restore Hotfix (2026-03-27T01:23:04Z)

- Restored runtime scripts from backup package at
  /Volumes/VoiceBridge-20260326/voice-bridge-package-20260325/bin.
- Added minimal stability fixes:
  - voice_server.py: robust process detection in /activate, plus reliable
    stream_watch and voice-response-audio-watch startup.
  - stream_watch.py: terminal injection uses Terminal do script in locked tab
    (no System Events keystrokes), with tty basename/full-path matching.
- Verified markers through runtime path:
  - REANCHOR_VERIFY_1774574201
  - TAB_CONTENT_CHECK_1774574226
  - TAB_CONTENT_CHECK2_1774574237
  - FINAL_RESTORE_PROBE_1774574368
  - WORKING_RESTORE_FINAL_1774574525
- Cmd+Option+click daemon is now running as a standalone user process for stable
  anchoring.
- Auto-submit reliability fix: terminal path now uses direct tty write with
  newline submit (mode=tty-write) and keeps do-script as fallback.
  - verified marker: AUTO_SUBMIT_FIX_1774574683
- Submit-path restore (latest): stream_watch terminal submit switched back to
  clipboard-keypress mode; do-script + tty-write retained as fallbacks.
- Runtime currently uses stream_watch as a manual user process (not launchd
  child), which restored reliable Codex turn commit behavior.
- Proof marker committed as user turn: TURN_COMMIT_RETEST_1774575072_7031.

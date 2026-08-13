#!/usr/bin/env python3
"""
voice-response-audio-watch.py

Polls a Terminal tab's contents, detects newly appended text, and optionally
speaks likely assistant output when response-audio mode is enabled.
"""

from __future__ import annotations

import argparse
import fcntl
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
import glob
from collections import deque
from datetime import datetime, timezone

def normalize_profile(raw: str | None) -> str:
    profile = (raw or "main").strip().lower()
    profile = re.sub(r"[^a-z0-9_-]+", "_", profile).strip("_")
    return profile or "main"


def profile_from_argv(default: str) -> str:
    args = sys.argv[1:]
    i = 0
    while i < len(args):
        token = args[i]
        if token == "--profile":
            if i + 1 < len(args):
                return args[i + 1]
            return default
        if token.startswith("--profile="):
            return token.split("=", 1)[1]
        i += 1
    return default


def is_default_profile(profile: str) -> bool:
    return profile in {"main", "default", "primary"}


def profile_suffix(profile: str) -> str:
    return "" if is_default_profile(profile) else f"_{profile}"


def default_voice_for_profile(profile: str) -> str:
    # Inky is the TNF voice front door — one speaker identity for all beam TTS.
    inky = os.environ.get("VOICE_INKY_VOICE", "").strip()
    if inky:
        return inky
    normalized = normalize_profile(profile)
    if normalized in {"b", "samantha"}:
        return "Samantha"
    return os.environ.get("VOICE_RESPONSE_AUDIO_VOICE", "Daniel")


VOICEBRIDGE_PROFILE = normalize_profile(
    profile_from_argv(os.environ.get("VOICEBRIDGE_PROFILE", "main"))
)
os.environ["VOICEBRIDGE_PROFILE"] = VOICEBRIDGE_PROFILE
PROFILE_SUFFIX = profile_suffix(VOICEBRIDGE_PROFILE)


def state_file_name(name: str) -> str:
    if not PROFILE_SUFFIX:
        return name
    if "." in name:
        stem, ext = name.rsplit(".", 1)
        return f"{stem}{PROFILE_SUFFIX}.{ext}"
    return f"{name}{PROFILE_SUFFIX}"


def resolve_state_dir() -> Path:
    explicit = os.environ.get("VOICEBRIDGE_STATE_DIR", "").strip()
    if explicit:
        return Path(explicit).expanduser()

    env_root = os.environ.get("VOICEBRIDGE_PROJECT_ROOT", "").strip() or os.environ.get("THE_NEW_FUSE_HOME", "").strip()
    if env_root:
        root = Path(env_root).expanduser()
        if root.is_dir():
            return root / ".voicebridge"

    cur = Path.cwd()
    while cur != cur.parent:
        if cur.name == "The-New-Fuse" and (cur / "apps").is_dir():
            return cur / ".voicebridge"
        cur = cur.parent

    for candidate in (
        Path("~/The-New-Fuse").expanduser(),
        Path("~/Desktop/The-New-Fuse").expanduser(),
        Path("~/Projects/The-New-Fuse").expanduser(),
    ):
        if candidate.is_dir():
            return candidate / ".voicebridge"

    for pattern in (
        "~/Desktop/*/The-New-Fuse",
        "~/Projects/*/The-New-Fuse",
        "~/*/The-New-Fuse",
    ):
        for candidate in glob.glob(os.path.expanduser(pattern)):
            candidate_path = Path(candidate)
            if (candidate_path / "apps").is_dir():
                return candidate_path / ".voicebridge"

    return Path("~/.local/share/The-New-Fuse/.voicebridge").expanduser()


STATE_DIR = resolve_state_dir()
LEGACY_STATE_DIR = Path("~/.openclaw").expanduser()
STATE_DIR.mkdir(parents=True, exist_ok=True)
for name in (
    "voice_stream.txt",
    "voice_target.json",
    "voice_target_tty",
    "voice_mic_paused",
    "voice_response_audio_enabled",
    "voice_bridge_cloud.env",
):
    src = LEGACY_STATE_DIR / name
    dst = STATE_DIR / state_file_name(name)
    if src.exists() and not dst.exists():
        try:
            dst.write_bytes(src.read_bytes())
        except Exception:
            pass

TARGET_JSON_FILE = STATE_DIR / state_file_name("voice_target.json")
LEGACY_TTY_FILE = STATE_DIR / state_file_name("voice_target_tty")
ENABLE_FILE = STATE_DIR / state_file_name("voice_response_audio_enabled")
AI_SPEAKING_FLAG = Path(f"/tmp/ai_is_speaking{PROFILE_SUFFIX}")
LAST_AI_SPEECH_TS_FILE = Path(f"/tmp/voice_last_ai_speech_ts{PROFILE_SUFFIX}")
LAST_USER_INPUT_TS_FILE = Path(f"/tmp/voice_last_user_input_ts{PROFILE_SUFFIX}")
LAST_USER_INPUT_TEXT_FILE = Path(f"/tmp/voice_last_user_input_text{PROFILE_SUFFIX}")
LAST_ASSISTANT_OUTPUT_TS_FILE = Path(f"/tmp/voice_last_assistant_output_ts{PROFILE_SUFFIX}")
LAST_ASSISTANT_OUTPUT_TEXT_FILE = Path(f"/tmp/voice_last_assistant_output_text{PROFILE_SUFFIX}")

POLL_SECONDS = float(os.environ.get("VOICE_RESPONSE_AUDIO_POLL_SECONDS", "0.9"))
MAX_TAIL_CHARS = int(os.environ.get("VOICE_RESPONSE_AUDIO_MAX_TAIL_CHARS", "12000"))
MAX_SPEAK_CHARS = int(os.environ.get("VOICE_RESPONSE_AUDIO_MAX_SPEAK_CHARS", "420"))
MIN_SPEAK_CHARS = int(os.environ.get("VOICE_RESPONSE_AUDIO_MIN_SPEAK_CHARS", "18"))
POST_SPEECH_DELAY_SECONDS = float(
    os.environ.get("VOICE_RESPONSE_AUDIO_POST_DELAY_SECONDS", "2.0")
)
VOICE_NAME = os.environ.get(
    "VOICE_INKY_VOICE",
    os.environ.get("VOICE_RESPONSE_AUDIO_VOICE", default_voice_for_profile(VOICEBRIDGE_PROFILE)),
)
INKY_SPEAK_AS_FRONT_DOOR = os.environ.get("VOICE_INKY_FRONT_DOOR_TTS", "1").strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}
SPEECH_LOCK_FILE = Path(os.environ.get("VOICE_RESPONSE_AUDIO_SPEECH_LOCK_FILE", "/tmp/codex_voice.lock"))
SPEECH_LOCK_TIMEOUT_SECONDS = float(
    os.environ.get("VOICE_RESPONSE_AUDIO_SPEECH_LOCK_TIMEOUT_SECONDS", "3.0")
)
QUIET_WINDOW_SECONDS = float(os.environ.get("VOICE_RESPONSE_AUDIO_QUIET_WINDOW_SECONDS", "1.2"))
STABLE_BEFORE_SPEAK_SECONDS = float(
    os.environ.get("VOICE_RESPONSE_AUDIO_STABLE_SECONDS", "0.9")
)
MIC_PAUSE_FILE = STATE_DIR / state_file_name("voice_mic_paused")
LAST_AI_SPEECH_TEXT_FILE = Path(f"/tmp/voice_last_ai_speech_text{PROFILE_SUFFIX}")
TTS_QUEUE_FILE = STATE_DIR / state_file_name("inky_tts_queue.txt")
ALWAYS_SPEAK_IDLE_REPLY = os.environ.get("VOICE_INKY_ALWAYS_SPEAK_IDLE_REPLY", "1").strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}
ECHO_SUPPRESS_ENABLED = os.environ.get("VOICE_RESPONSE_AUDIO_ECHO_SUPPRESS", "1").strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}
ECHO_RECENT_SECONDS = float(os.environ.get("VOICE_RESPONSE_AUDIO_ECHO_RECENT_SECONDS", "18"))
ECHO_OVERLAP_THRESHOLD = float(os.environ.get("VOICE_RESPONSE_AUDIO_ECHO_OVERLAP_THRESHOLD", "0.55"))
ALLOW_LEGACY_TTY_FALLBACK = os.environ.get("VOICE_RESPONSE_AUDIO_ALLOW_LEGACY_TTY_FALLBACK", "1").strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}
VOICE_NO_FOCUS_STEAL = os.environ.get("VOICE_NO_FOCUS_STEAL", "1").strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}
VOICE_RESPONSE_AUDIO_ACTIVATE_TARGET = os.environ.get(
    "VOICE_RESPONSE_AUDIO_ACTIVATE_TARGET",
    "0" if VOICE_NO_FOCUS_STEAL else "1",
).strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}
LOG_PREFIX = f"voice-response-audio[{VOICEBRIDGE_PROFILE}]"
STRICT_ASSISTANT_BULLET_MODE = os.environ.get("VOICE_RESPONSE_AUDIO_STRICT_BULLET_MODE", "0").strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}
REQUIRE_SAY_TAG = os.environ.get("VOICE_RESPONSE_AUDIO_REQUIRE_TAG", "0").strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}
SAY_TAG_PREFIX = os.environ.get("VOICE_RESPONSE_AUDIO_TAG_PREFIX", "[[SAY]]")
APPLESCRIPT_TIMEOUT_SECONDS = float(os.environ.get("VOICE_RESPONSE_AUDIO_APPLESCRIPT_TIMEOUT_SECONDS", "3.0"))
TERMINAL_AUTOMATION_GUARD_FILE = Path(
    os.environ.get(
        "VOICE_RESPONSE_AUDIO_TERMINAL_AUTOMATION_GUARD_FILE",
        "~/.tnf/terminal-heartbeat/state/terminal-heartbeat-applescript-guard.json",
    )
).expanduser()

NO_TTY_MARKER = "__VOICE_NO_TTY__"
ANSI_ESCAPE_RE = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")
NOISE_LINE_RE = re.compile(r"^[\s`~!@#$%^&*()_+=\[\]{}|\\:;\"'<>,.?/-]*$")
SHELL_CMD_RE = re.compile(
    r"^(cd|ls|pwd|cat|git|npm|pnpm|python3?|node|curl|echo|export|open|voice)\b",
    re.IGNORECASE,
)
SHELL_PROMPT_RE = re.compile(
    r"^\s*(\$|%|#|❯|➜|›|>>>|\.{3}|[A-Za-z0-9._-]+@[A-Za-z0-9._-]+[:~])"
)
ENV_ASSIGN_RE = re.compile(r"^(export\s+)?[A-Z][A-Z0-9_]*=.+")
JSONISH_RE = re.compile(r"^\s*[\{\[].*[\}\]]\s*$")
SPINNER_RE = re.compile(r"[\u2800-\u28FF⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏⠘⠆]+")
TOKEN_STATUS_RE = re.compile(
    r"\b(\d+(\.\d+)?k?\s*tokens|files edited|run everything|ctrl\+c to stop|"
    r"input lines hidden|output lines hidden|ctrl\+[a-z0-9]|ctrl\+o to expand|"
    r"\d+\s+task|send to background|to review)\b",
    re.IGNORECASE,
)
VOICE_INJECT_RE = re.compile(r"[\[]?\s*↑t\d+\s*[\]]?", re.IGNORECASE)
TOOL_UI_RE = re.compile(
    r"(bash\(|shell\(|read\s+\.\.\.|grepping|strreplace|modifiers matched|"
    r"anchor set:|foundtab|osascript|/users/danielgoldberg|"
    r"black small square)",
    re.IGNORECASE,
)
SKIP_PHRASES = (
    "tab to review message",
    "press ctrl+c to stop",
    "voice link active",
    "activate beam",
    "listening with batched auto-submit",
    "background terminal running",
    "chunk id:",
    "process exited with code",
    "working (",
    "ran ",
    "conversation interrupted - tell the model what to do differently",
    "hit `/feedback` to report the issue",
    "hit /feedback to report the issue",
    "something went wrong",
    "context left",
    "voice-response-audio:",
    "post /send http/1.1",
    "command pid",
    "tail -n ",
    "rg -n ",
    "voicebridge_",
    "mic_state",
    "target_state",
    "send to background",
    "lines hidden",
    "run everything",
)


def detect_current_tty() -> str | None:
    for handle in (sys.stdin, sys.stdout, sys.stderr):
        try:
            return os.path.basename(os.ttyname(handle.fileno()))
        except Exception:
            continue
    return None


def applescript_quote(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def is_terminal_like(app_name: str, bundle_id: str) -> bool:
    app = (app_name or "").strip().lower()
    bundle = (bundle_id or "").strip().lower()
    return "terminal" in app or "iterm" in app or "terminal" in bundle or "iterm" in bundle


def active_terminal_automation_hold_until() -> str | None:
    try:
        payload = json.loads(TERMINAL_AUTOMATION_GUARD_FILE.read_text(encoding="utf-8"))
        hold_until = str(payload.get("holdUntil") or "")
        if not hold_until:
            return None
        parsed = datetime.fromisoformat(hold_until.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        if parsed > datetime.now(timezone.utc):
            return hold_until
    except Exception:
        return None
    return None


def read_target_tty(startup_tty: str | None) -> str | None:
    try:
        if TARGET_JSON_FILE.exists():
            payload = json.loads(TARGET_JSON_FILE.read_text(encoding="utf-8"))
            kind = payload.get("kind")
            if kind == "terminal":
                tty = str(payload.get("tty", "")).strip()
                if tty:
                    return os.path.basename(tty)
                return None
            if kind in {"point", "app"}:
                tty = str(payload.get("tty", "")).strip()
                if tty:
                    return os.path.basename(tty)
                app_name = str(payload.get("app", ""))
                bundle_id = str(payload.get("bundle_id", ""))
                if is_terminal_like(app_name, bundle_id) and startup_tty and ALLOW_LEGACY_TTY_FALLBACK:
                    return os.path.basename(startup_tty)
                return None
    except Exception:
        pass

    try:
        if LEGACY_TTY_FILE.exists():
            tty = LEGACY_TTY_FILE.read_text(encoding="utf-8").strip()
            if tty:
                return os.path.basename(tty)
    except Exception:
        pass

    if startup_tty:
        return os.path.basename(startup_tty)
    return None


def read_terminal_tail(tty: str, tail_chars: int) -> str:
    hold_until = active_terminal_automation_hold_until()
    if hold_until:
        log(f"terminal read skipped; AppleScript hold active until {hold_until}")
        return ""

    quoted_tty = applescript_quote(tty)
    activate_target = "true" if VOICE_RESPONSE_AUDIO_ACTIVATE_TARGET else "false"
    script = f'''
set targetTTYRaw to "{quoted_tty}"
set activateTarget to {activate_target}
if targetTTYRaw starts with "/dev/" then
    set targetTTYDev to targetTTYRaw
else
    set targetTTYDev to "/dev/" & targetTTYRaw
end if
tell application "Terminal"
    set foundTab to missing value
    set foundWindow to missing value
    repeat with w in windows
        repeat with t in tabs of w
            set tabTTY to tty of t
            if tabTTY is targetTTYRaw or tabTTY is targetTTYDev then
                set foundTab to t
                set foundWindow to w
                exit repeat
            end if
        end repeat
        if foundTab is not missing value then exit repeat
    end repeat

    if foundTab is missing value then
        return "{NO_TTY_MARKER}"
    end if

    -- Prefer history: cursor-agent / boxed TUIs redraw contents each frame,
    -- and `contents of tab` often errors when the tab is not frontmost.
    if activateTarget then
        set selected of foundTab to true
        set index of foundWindow to 1
        activate
    end if
    try
        set tabText to (history of foundTab as text)
    on error
        try
            set tabText to (contents of foundTab as text)
        on error
            try
                set tabText to (contents of selected tab of foundWindow as text)
            on error
                return "{NO_TTY_MARKER}"
            end try
        end try
    end try
    return tabText
end tell
'''.strip()

    try:
        proc = subprocess.run(
            ["osascript"],
            input=script,
            text=True,
            capture_output=True,
            check=False,
            timeout=APPLESCRIPT_TIMEOUT_SECONDS,
        )
    except subprocess.TimeoutExpired:
        log(f"osascript read timed out after {APPLESCRIPT_TIMEOUT_SECONDS:.1f}s")
        return ""
    if proc.returncode != 0:
        err = (proc.stderr or "").strip()
        if err:
            log(f"osascript read error: {err[:180]}")
        return ""

    output = proc.stdout or ""
    if NO_TTY_MARKER in output:
        return ""
    if len(output) > tail_chars:
        return output[-tail_chars:]
    return output


def overlap_suffix_prefix(previous: str, current: str) -> int:
    max_len = min(len(previous), len(current))
    for size in range(max_len, 0, -1):
        if previous[-size:] == current[:size]:
            return size
    return 0


def extract_delta(previous: str, current: str) -> str:
    if not previous:
        return ""
    if current.startswith(previous):
        return current[len(previous) :]
    overlap = overlap_suffix_prefix(previous, current)
    if overlap > 0:
        return current[overlap:]
    return ""


def extract_new_prose_lines(previous: str, current: str) -> str:
    """TUI-friendly diff: Terminal apps like cursor-agent redraw history."""
    prev_norm = {
        strip_box_chrome(ln)
        for ln in normalize_text(previous).splitlines()
        if strip_box_chrome(ln)
    }
    fresh: list[str] = []
    for raw in normalize_text(current).splitlines():
        line = strip_box_chrome(raw)
        if not line or line in prev_norm:
            continue
        if is_noise_line(line):
            continue
        fresh.append(line)
    return "\n".join(fresh)


def normalize_text(raw: str) -> str:
    text = raw.replace("\r", "\n")
    text = ANSI_ESCAPE_RE.sub("", text)
    text = text.replace("\u200b", "")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


def strip_box_chrome(line: str) -> str:
    s = (line or "").strip()
    if not s:
        return ""
    # Cursor-agent / boxed TUIs wrap prose in drawing characters.
    s = re.sub(r"^[\s│┃║|▌▐]+", "", s)
    s = re.sub(r"[\s│┃║|▌▐]+$", "", s)
    s = s.strip("─━═-_")
    return s.strip()


def is_noise_line(line: str) -> bool:
    stripped = strip_box_chrome(line)
    if not stripped:
        return True
    # Never speak user voice-inject markers — that creates an echo loop.
    if VOICE_INJECT_RE.search(stripped):
        return True
    if TOOL_UI_RE.search(stripped):
        return True
    if stripped.startswith(("└", "• Ran ", "• Working", "────────────────", "$ ", "→")):
        return True
    if re.search(r"\[\d{2}:\d{2}:\d{2}\]", stripped):
        return True
    if NOISE_LINE_RE.fullmatch(stripped):
        return True
    if ENV_ASSIGN_RE.match(stripped) or JSONISH_RE.match(stripped):
        return True
    if SPINNER_RE.search(stripped) or TOKEN_STATUS_RE.search(stripped):
        return True
    lower = stripped.lower()
    # Drop lines with very low alpha density (command/log gibberish).
    alpha = sum(ch.isalpha() for ch in lower)
    if len(lower) >= 24 and (alpha / max(1, len(lower))) < 0.45:
        return True
    if any(phrase in lower for phrase in SKIP_PHRASES):
        return True
    if SHELL_PROMPT_RE.match(stripped):
        return True
    if SHELL_CMD_RE.match(stripped):
        return True
    # Pure UI chrome / tips / status.
    if lower.startswith(("tip:", "cursor agent", "v20", "? for shortcuts", "use /", "auto ·", "reading", "running")):
        return True
    return False


def extract_assistant_paragraphs(lines: list[str]) -> list[str]:
    """Group contiguous prose lines; drop tool/user inject interruptions."""
    paragraphs: list[str] = []
    current: list[str] = []
    for raw in lines:
        line = strip_box_chrome(raw)
        if not line or is_noise_line(line):
            if current:
                paragraphs.append(re.sub(r"\s+", " ", " ".join(current)).strip())
                current = []
            continue
        ll = line.lower()
        if ll.startswith(("test now:", "controls:", "state dir:", "ai response audio:", "cloud forwarding:")):
            if current:
                paragraphs.append(re.sub(r"\s+", " ", " ".join(current)).strip())
                current = []
            continue
        if re.match(r"^\d+\.\s", line):
            if current:
                paragraphs.append(re.sub(r"\s+", " ", " ".join(current)).strip())
                current = []
            continue
        current.append(line)
    if current:
        paragraphs.append(re.sub(r"\s+", " ", " ".join(current)).strip())
    return [p for p in paragraphs if p]


def clip_for_speech(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    candidate = text[:max_chars]
    for token in (". ", "! ", "? ", "; ", ", "):
        idx = candidate.rfind(token)
        if idx >= 120:
            return candidate[: idx + 1].strip()
    split = candidate.rfind(" ")
    if split >= 120:
        return candidate[:split].strip()
    return candidate.strip()


def looks_technical_or_meta(text: str) -> bool:
    s = text.strip().lower()
    if not s:
        return True
    technical_markers = (
        "voice-response-audio",
        "post /send",
        "http/1.1",
        "chunk id",
        "process exited",
        "command pid",
        "tail -n",
        "rg -n",
        "pkill",
        "nohup",
        "python3 -u",
        "set -e",
        "lsof",
        "shasum",
        "synced ",
        "working (",
        "explored",
        "• ran ",
        "• working",
        "stall break",
        "no commands executed",
        "auto-held after",
        "self-prompting to continue",
        "remaining artifacts",
    )
    if any(marker in s for marker in technical_markers):
        return True
    alpha = sum(ch.isalpha() for ch in s)
    alpha_ratio = alpha / max(1, len(s))
    # Path-heavy / command-heavy strings are jargon when prose density is low.
    slash_count = s.count("/")
    if slash_count >= 3 and alpha_ratio < 0.62:
        return True
    symbol_count = sum(1 for ch in s if ch in "{}[]|`$<>")
    if symbol_count >= 4 and alpha_ratio < 0.62:
        return True
    if len(s) >= 24 and alpha_ratio < 0.50:
        return True
    return False


def build_speakable_chunk(delta: str) -> str:
    normalized = normalize_text(delta)
    if REQUIRE_SAY_TAG:
        tagged = []
        for ln in normalized.splitlines():
            s = ln.strip()
            if not s.startswith(SAY_TAG_PREFIX):
                continue
            body = s[len(SAY_TAG_PREFIX):].strip()
            if body:
                tagged.append(body)
        if not tagged:
            return ""
        return clip_for_speech(" ".join(tagged), MAX_SPEAK_CHARS)

    raw_lines = [ln.rstrip() for ln in normalized.splitlines() if ln.strip()]
    if STRICT_ASSISTANT_BULLET_MODE:
        candidates = []
        i = 0
        while i < len(raw_lines):
            line = raw_lines[i].lstrip()
            if not line.startswith("• "):
                i += 1
                continue
            lead = line[2:].strip()
            lead_lower = lead.lower()
            if lead_lower.startswith(("ran ", "working", "explored")):
                i += 1
                continue

            parts = [lead]
            j = i + 1
            while j < len(raw_lines):
                nxt_raw = raw_lines[j]
                nxt = nxt_raw.lstrip()
                if (
                    nxt.startswith(("• ", "› ", "└", "│"))
                    or nxt.startswith("? for shortcuts")
                    or nxt.startswith("Use /skills")
                    or set(nxt) == {"─"}
                ):
                    break
                parts.append(nxt)
                j += 1

            text = re.sub(r"\s+", " ", " ".join(parts)).strip()
            if len(text) >= MIN_SPEAK_CHARS and not looks_technical_or_meta(text):
                candidates.append(text)
            i = j

        if not candidates:
            return ""
        return clip_for_speech(candidates[-1], MAX_SPEAK_CHARS)

    lines = [ln.strip() for ln in raw_lines]
    paragraphs = extract_assistant_paragraphs(lines)
    if not paragraphs:
        return ""

    # Speak only the latest clean assistant paragraph — never a mash of tools + injects.
    for candidate in reversed(paragraphs):
        chunk = candidate.replace("▎", " ").replace("```", " ")
        chunk = VOICE_INJECT_RE.sub(" ", chunk)
        chunk = re.sub(r"\s+", " ", chunk).strip()
        if len(chunk) < MIN_SPEAK_CHARS:
            continue
        if looks_technical_or_meta(chunk):
            continue
        if TOOL_UI_RE.search(chunk) or TOKEN_STATUS_RE.search(chunk):
            continue
        if not looks_like_spoken_prose(chunk):
            continue
        return clip_for_speech(chunk, MAX_SPEAK_CHARS)
    return ""


def looks_like_spoken_prose(text: str) -> bool:
    """Keep macOS say on conversational assistant lines, not tool/code dumps."""
    s = text.strip()
    if not s:
        return False
    words = [w for w in re.split(r"\s+", s) if w]
    # Short confirmations still need audio ("Got it.", "Yes — locked.").
    if len(words) < 3:
        return False
    lower = s.lower()
    if TOKEN_STATUS_RE.search(s) or SPINNER_RE.search(s):
        return False
    codeish = (
        "def ",
        "class ",
        "import ",
        "const ",
        "function ",
        "subprocess",
        "osascript",
        "pathlib",
        "strreplace",
        "old_string",
        "new_string",
        "function_calls",
        "tool_call",
        "strip_box",
        "voicebridge",
    )
    if any(token in lower for token in codeish):
        return False
    if s.count("_") >= 2:
        return False
    if "=" in s and re.search(r"\w+\(", s):
        return False
    alpha = sum(ch.isalpha() for ch in s)
    if (alpha / max(1, len(s))) < 0.55:
        return False
    # Prefer sentence-like text; allow short conversational replies without punctuation.
    if not re.search(r"[.!?—–-]", s) and len(words) < 6:
        return False
    return True


def normalize_for_compare(text: str) -> list[str]:
    lowered = re.sub(r"[^a-z0-9\s]", " ", text.lower())
    words = [w for w in lowered.split() if len(w) >= 2]
    return words


def fingerprint_chunk(text: str) -> str:
    lowered = re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()
    lowered = re.sub(r"\s+", " ", lowered)
    return lowered[:220]


def read_last_user_input_ts() -> float:
    try:
        raw = LAST_USER_INPUT_TS_FILE.read_text(encoding="utf-8").strip()
        return float(raw)
    except Exception:
        return 0.0


def read_last_user_input_text() -> str:
    try:
        return LAST_USER_INPUT_TEXT_FILE.read_text(encoding="utf-8").strip()
    except Exception:
        return ""


def should_suppress_echo(chunk: str, now: float, last_user_ts: float) -> bool:
    if not ECHO_SUPPRESS_ENABLED:
        return False
    if last_user_ts <= 0 or (now - last_user_ts) > ECHO_RECENT_SECONDS:
        return False
    user_text = read_last_user_input_text()
    if not user_text:
        return False

    chunk_words = set(normalize_for_compare(chunk))
    user_words = set(normalize_for_compare(user_text))
    if len(chunk_words) < 4 or len(user_words) < 4:
        return False

    intersection = chunk_words.intersection(user_words)
    overlap = len(intersection) / max(1, len(chunk_words))
    if overlap >= ECHO_OVERLAP_THRESHOLD:
        return True
    return False


def terminal_looks_busy(text: str) -> bool:
    tail = (text or "")[-700:]
    if SPINNER_RE.search(tail):
        return True
    lower = tail.lower()
    busy_markers = (
        " reading",
        " running",
        " thinking",
        "ctrl+b twice",
        "send to background",
        "working (",
    )
    return any(marker in lower for marker in busy_markers)


def drain_inky_tts_queue() -> int:
    """Guaranteed speak path: every queued line is spoken as Inky."""
    if not ENABLE_FILE.exists() or not TTS_QUEUE_FILE.exists():
        return 0
    try:
        raw = TTS_QUEUE_FILE.read_text(encoding="utf-8")
    except Exception:
        return 0
    lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
    if not lines:
        return 0
    try:
        TTS_QUEUE_FILE.write_text("", encoding="utf-8")
    except Exception:
        return 0
    spoken_n = 0
    for line in lines:
        if VOICE_INJECT_RE.search(line):
            continue
        speak(line)
        spoken_n += 1
    return spoken_n


def latest_idle_assistant_chunk(terminal_text: str) -> str:
    paragraphs = extract_assistant_paragraphs(
        [ln for ln in normalize_text(terminal_text).splitlines() if ln.strip()]
    )
    for candidate in reversed(paragraphs):
        chunk = build_speakable_chunk(candidate)
        if chunk:
            return chunk
    # Looser fallback: last paragraph that clears meta/noise only.
    for candidate in reversed(paragraphs):
        chunk = re.sub(r"\s+", " ", candidate.replace("▎", " ")).strip()
        chunk = VOICE_INJECT_RE.sub(" ", chunk).strip()
        if len(chunk) < MIN_SPEAK_CHARS:
            continue
        if looks_technical_or_meta(chunk) or TOOL_UI_RE.search(chunk):
            continue
        if VOICE_INJECT_RE.search(chunk):
            continue
        return clip_for_speech(chunk, MAX_SPEAK_CHARS)
    return build_speakable_chunk("\n".join(paragraphs[-4:])) if paragraphs else ""


def speak(text: str) -> None:
    if not text:
        return
    # TNF front door: all beam TTS is Inky's audio output.
    spoken = text
    if INKY_SPEAK_AS_FRONT_DOOR and not spoken.lower().lstrip().startswith("inky"):
        # Don't re-prefix every sentence; only tag stream for UI.
        pass
    AI_SPEAKING_FLAG.touch(exist_ok=True)
    # Stop listen from capturing TTS into the next user transcript.
    try:
        MIC_PAUSE_FILE.write_text("1\n", encoding="utf-8")
    except Exception:
        pass
    try:
        LAST_AI_SPEECH_TEXT_FILE.write_text(spoken, encoding="utf-8")
    except Exception:
        pass
    try:
        log(f'inky speaking ({VOICE_NAME}): "{spoken[:120]}"')
        try:
            stream = STATE_DIR / state_file_name("voice_stream.txt")
            with stream.open("a", encoding="utf-8") as f:
                f.write(f"[INKY] {spoken[:500]}\n")
        except Exception:
            pass
        lock_fh = None
        lock_acquired = False
        deadline = time.time() + max(0.1, SPEECH_LOCK_TIMEOUT_SECONDS)
        try:
            lock_fh = SPEECH_LOCK_FILE.open("a", encoding="utf-8")
            while time.time() < deadline:
                try:
                    fcntl.flock(lock_fh.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                    lock_acquired = True
                    break
                except BlockingIOError:
                    time.sleep(0.03)
                except Exception:
                    break
            subprocess.run(
                ["say", "-v", VOICE_NAME, spoken],
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        finally:
            if lock_fh is not None:
                try:
                    if lock_acquired:
                        fcntl.flock(lock_fh.fileno(), fcntl.LOCK_UN)
                except Exception:
                    pass
                try:
                    lock_fh.close()
                except Exception:
                    pass
        if POST_SPEECH_DELAY_SECONDS > 0:
            time.sleep(POST_SPEECH_DELAY_SECONDS)
    finally:
        try:
            AI_SPEAKING_FLAG.unlink()
        except FileNotFoundError:
            pass
        except Exception:
            pass
        try:
            LAST_AI_SPEECH_TS_FILE.write_text(f"{time.time():.6f}\n", encoding="utf-8")
        except Exception:
            pass
        try:
            if MIC_PAUSE_FILE.exists():
                MIC_PAUSE_FILE.unlink()
        except Exception:
            pass


def write_last_assistant_output(text: str) -> None:
    if not text:
        return
    now = time.time()
    try:
        LAST_ASSISTANT_OUTPUT_TEXT_FILE.write_text(text, encoding="utf-8")
    except Exception:
        pass
    try:
        LAST_ASSISTANT_OUTPUT_TS_FILE.write_text(f"{now:.6f}\n", encoding="utf-8")
    except Exception:
        pass


def log(message: str) -> None:
    ts = time.strftime("%H:%M:%S")
    print(f"[{ts}] {LOG_PREFIX}: {message}", flush=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Watch terminal output and speak AI responses.")
    parser.add_argument(
        "--profile",
        default=VOICEBRIDGE_PROFILE,
        help="Voice bridge profile name (default: main).",
    )
    parser.add_argument(
        "--target-tty",
        default=os.environ.get("VOICE_TARGET_TTY", "").strip(),
        help="Preferred startup tty (example: ttys009).",
    )
    return parser.parse_args()


import threading
import redis

STREAM_FILE = STATE_DIR / state_file_name("voice_stream.txt")

def redis_listener_thread():
    """Listens to tnf:conversations and feeds AI replies into the voice stream."""
    try:
        r = redis.Redis(
            host=os.environ.get("REDIS_HOST", "127.0.0.1"),
            port=int(os.environ.get("REDIS_PORT", "6379")),
            decode_responses=True
        )
        pubsub = r.pubsub()
        pubsub.subscribe("tnf:conversations")
        
        log("Redis listener active on tnf:conversations")
        
        for message in pubsub.listen():
            if message["type"] != "message":
                continue
            
            try:
                data = json.loads(message["data"])
                # We only want to speak messages FROM AI platforms
                platform = data.get("from", {}).get("platform", "")
                content = data.get("content", "")
                
                if platform in ["gemini", "claude", "antigravity", "cursor"] and content:
                    # Append to stream with [A2A] prefix to trigger TTS in stream_watch.py
                    with open(STREAM_FILE, "a", encoding="utf-8") as f:
                        f.write(f"[A2A] {content}\n")
                    log(f"Fed AI message to stream for TTS: {content[:60]}...")
            except Exception as e:
                log(f"Redis message processing error: {e}")
                
    except Exception as e:
        log(f"Redis connection error: {e}")

def main() -> None:
    args = parse_args()
    
    # Start Redis listener in background
    t = threading.Thread(target=redis_listener_thread, daemon=True)
    t.start()
    
    arg_profile = normalize_profile(args.profile)
    if arg_profile != VOICEBRIDGE_PROFILE:
        log(
            "profile mismatch resolved from argv/environment: "
            f"requested={arg_profile} active={VOICEBRIDGE_PROFILE}"
        )
    startup_tty = os.path.basename(args.target_tty) if args.target_tty else detect_current_tty()

    active_tty: str | None = None
    snapshot = ""
    last_spoken = ""
    recent_spoken: deque[tuple[float, str]] = deque(maxlen=80)
    pending_chunk = ""
    pending_since = 0.0
    pending_fp = ""

    while True:
        # Always drain explicit Inky TTS queue first — independent of tty scrape.
        if ENABLE_FILE.exists():
            queued = drain_inky_tts_queue()
            if queued:
                time.sleep(POLL_SECONDS)
                continue

        target_tty = read_target_tty(startup_tty)

        if target_tty != active_tty:
            active_tty = target_tty
            snapshot = ""
            last_spoken = ""
            pending_chunk = ""
            pending_since = 0.0
            pending_fp = ""
            if active_tty:
                log(f"tracking tty: {active_tty}")
                snapshot = read_terminal_tail(active_tty, MAX_TAIL_CHARS)
            else:
                log("no active tty target")
            time.sleep(POLL_SECONDS)
            continue

        if not active_tty:
            time.sleep(POLL_SECONDS)
            continue

        current = read_terminal_tail(active_tty, MAX_TAIL_CHARS)
        if not current:
            time.sleep(POLL_SECONDS)
            continue

        appended = extract_delta(snapshot, current)
        prose = extract_new_prose_lines(snapshot, current)
        # Prefer filtered prose lines. Raw history deltas often include shell/UI chrome
        # when cursor-agent redraws mid-scrollback.
        if prose and (
            not appended
            or len(appended) > 600
            or looks_technical_or_meta(appended[:240])
        ):
            delta = prose
        else:
            delta = appended or prose
        snapshot = current

        if not ENABLE_FILE.exists():
            pending_chunk = ""
            pending_since = 0.0
            pending_fp = ""
            time.sleep(POLL_SECONDS)
            continue

        busy = terminal_looks_busy(current)
        now = time.time()
        if delta and not busy:
            log(f"delta chars={len(delta)}")
            chunk = build_speakable_chunk(delta)
            if chunk and chunk != last_spoken and VOICE_INJECT_RE.search(chunk) is None:
                fp = fingerprint_chunk(chunk)
                if fp != pending_fp:
                    pending_chunk = chunk
                    pending_fp = fp
                    pending_since = now
                    log("pending speakable chunk; waiting for idle settle")

        # Consistency: after user input, when agent is idle, always try latest reply.
        if (
            ALWAYS_SPEAK_IDLE_REPLY
            and not busy
            and not pending_chunk
        ):
            last_user_ts = read_last_user_input_ts()
            if last_user_ts > 0 and 1.5 <= (now - last_user_ts) <= 180.0:
                idle_chunk = latest_idle_assistant_chunk(current)
                if (
                    idle_chunk
                    and idle_chunk != last_spoken
                    and VOICE_INJECT_RE.search(idle_chunk) is None
                ):
                    pending_chunk = idle_chunk
                    pending_fp = fingerprint_chunk(idle_chunk)
                    pending_since = now - STABLE_BEFORE_SPEAK_SECONDS
                    log("idle-reply candidate armed")

        if busy:
            time.sleep(POLL_SECONDS)
            continue

        if not pending_chunk:
            time.sleep(POLL_SECONDS)
            continue

        if (now - pending_since) < STABLE_BEFORE_SPEAK_SECONDS:
            time.sleep(POLL_SECONDS)
            continue

        chunk = pending_chunk
        pending_chunk = ""
        pending_since = 0.0
        pending_fp = ""

        last_user_ts = read_last_user_input_ts()
        if last_user_ts > 0 and (now - last_user_ts) < QUIET_WINDOW_SECONDS:
            # Hold — do not drop; speak as soon as quiet window ends.
            pending_chunk = chunk
            pending_fp = fingerprint_chunk(chunk)
            pending_since = now
            log("hold: quiet window")
            time.sleep(POLL_SECONDS)
            continue

        if should_suppress_echo(chunk, now, last_user_ts):
            log("skip: echo-suppressed")
            time.sleep(POLL_SECONDS)
            continue

        fp = fingerprint_chunk(chunk)
        cutoff = now - 75.0
        while recent_spoken and recent_spoken[0][0] < cutoff:
            recent_spoken.popleft()
        if any(existing == fp for _, existing in recent_spoken):
            log("skip: recent-duplicate")
            time.sleep(POLL_SECONDS)
            continue

        write_last_assistant_output(chunk)
        speak(chunk)
        last_spoken = chunk
        recent_spoken.append((now, fp))
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass

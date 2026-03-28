#!/usr/bin/env python3
"""
voice-response-audio-watch.py

Polls a Terminal tab's contents, detects newly appended text, and optionally
speaks likely assistant output when response-audio mode is enabled.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
import glob
from collections import deque

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

POLL_SECONDS = float(os.environ.get("VOICE_RESPONSE_AUDIO_POLL_SECONDS", "0.9"))
MAX_TAIL_CHARS = int(os.environ.get("VOICE_RESPONSE_AUDIO_MAX_TAIL_CHARS", "12000"))
MAX_SPEAK_CHARS = int(os.environ.get("VOICE_RESPONSE_AUDIO_MAX_SPEAK_CHARS", "420"))
MIN_SPEAK_CHARS = int(os.environ.get("VOICE_RESPONSE_AUDIO_MIN_SPEAK_CHARS", "28"))
POST_SPEECH_DELAY_SECONDS = float(
    os.environ.get("VOICE_RESPONSE_AUDIO_POST_DELAY_SECONDS", "0.30")
)
VOICE_NAME = os.environ.get("VOICE_RESPONSE_AUDIO_VOICE", "Daniel")
QUIET_WINDOW_SECONDS = float(os.environ.get("VOICE_RESPONSE_AUDIO_QUIET_WINDOW_SECONDS", "0.9"))
ECHO_SUPPRESS_ENABLED = os.environ.get("VOICE_RESPONSE_AUDIO_ECHO_SUPPRESS", "1").strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}
ECHO_RECENT_SECONDS = float(os.environ.get("VOICE_RESPONSE_AUDIO_ECHO_RECENT_SECONDS", "18"))
ECHO_OVERLAP_THRESHOLD = float(os.environ.get("VOICE_RESPONSE_AUDIO_ECHO_OVERLAP_THRESHOLD", "0.74"))
ALLOW_LEGACY_TTY_FALLBACK = os.environ.get("VOICE_RESPONSE_AUDIO_ALLOW_LEGACY_TTY_FALLBACK", "1").strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}
LOG_PREFIX = f"voice-response-audio[{VOICEBRIDGE_PROFILE}]"
STRICT_ASSISTANT_BULLET_MODE = os.environ.get("VOICE_RESPONSE_AUDIO_STRICT_BULLET_MODE", "1").strip().lower() not in {
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
SKIP_PHRASES = (
    "tab to queue message",
    "press ctrl+c to stop",
    "voice link active",
    "activate beam",
    "listening with batched auto-submit",
    "background terminal running",
    "chunk id:",
    "process exited with code",
    "working (",
    "• ran ",
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
    " +",
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
    quoted_tty = applescript_quote(tty)
    script = f'''
set targetTTYRaw to "{quoted_tty}"
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

    set selected of foundTab to true
    set index of foundWindow to 1
    activate

    try
        set tabText to (contents of selected tab of foundWindow as text)
    on error
        try
            set tabText to (contents of front window as text)
        on error
            return "{NO_TTY_MARKER}"
        end try
    end try
    return tabText
end tell
'''.strip()

    proc = subprocess.run(
        ["osascript"],
        input=script,
        text=True,
        capture_output=True,
        check=False,
    )
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


def normalize_text(raw: str) -> str:
    text = raw.replace("\r", "\n")
    text = ANSI_ESCAPE_RE.sub("", text)
    text = text.replace("\u200b", "")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


def is_noise_line(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return True
    if stripped.startswith(("│", "└", "• Ran ", "• Working", "────────────────")):
        return True
    if re.search(r"\[\d{2}:\d{2}:\d{2}\]", stripped):
        return True
    if NOISE_LINE_RE.fullmatch(stripped):
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
    return False


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
        "/users/",
        "/tmp/",
        "tty",
        "lsof",
        "shasum",
        "synced ",
        "working (",
        "explored",
        "ran ",
    )
    if any(marker in s for marker in technical_markers):
        return True
    # Path-heavy / command-heavy strings are almost always jargon.
    slash_count = s.count("/")
    if slash_count >= 2:
        return True
    symbol_count = sum(1 for ch in s if ch in "{}[]|`$<>")
    if symbol_count >= 3:
        return True
    alpha = sum(ch.isalpha() for ch in s)
    if len(s) >= 24 and (alpha / max(1, len(s))) < 0.55:
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
    filtered = [ln for ln in lines if not is_noise_line(ln)]
    if not filtered:
        return ""
    # Prefer likely assistant prose lines; avoid numbered/meta instruction blocks.
    prose_lines = []
    for ln in filtered:
        ll = ln.lower()
        if ll.startswith(("test now:", "controls:", "state dir:", "ai response audio:", "cloud forwarding:")):
            continue
        if re.match(r"^\d+\.\s", ln):
            continue
        prose_lines.append(ln)
    if prose_lines:
        filtered = prose_lines
    chunk = " ".join(filtered)
    chunk = re.sub(r"\s+", " ", chunk).strip()
    if len(chunk) < MIN_SPEAK_CHARS:
        return ""
    if looks_technical_or_meta(chunk):
        return ""
    return clip_for_speech(chunk, MAX_SPEAK_CHARS)


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


def speak(text: str) -> None:
    if not text:
        return
    AI_SPEAKING_FLAG.touch(exist_ok=True)
    try:
        log(f'speaking: "{text[:120]}"')
        subprocess.run(
            ["say", "-v", VOICE_NAME, text],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
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


def main() -> None:
    args = parse_args()
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

    while True:
        target_tty = read_target_tty(startup_tty)

        if target_tty != active_tty:
            active_tty = target_tty
            snapshot = ""
            last_spoken = ""
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

        delta = extract_delta(snapshot, current)
        snapshot = current

        if not ENABLE_FILE.exists() or not delta:
            time.sleep(POLL_SECONDS)
            continue

        log(f"delta chars={len(delta)}")

        chunk = build_speakable_chunk(delta)
        if not chunk:
            log("skip: no speakable chunk")
            time.sleep(POLL_SECONDS)
            continue

        if chunk == last_spoken:
            time.sleep(POLL_SECONDS)
            continue

        now = time.time()
        last_user_ts = read_last_user_input_ts()
        if last_user_ts > 0 and (now - last_user_ts) < QUIET_WINDOW_SECONDS:
            log("skip: quiet window")
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

        speak(chunk)
        last_spoken = chunk
        recent_spoken.append((now, fp))
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass

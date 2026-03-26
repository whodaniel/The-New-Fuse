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

TARGET_JSON_FILE = Path("~/.openclaw/voice_target.json").expanduser()
LEGACY_TTY_FILE = Path("~/.openclaw/voice_target_tty").expanduser()
ENABLE_FILE = Path("~/.openclaw/voice_response_audio_enabled").expanduser()
AI_SPEAKING_FLAG = Path("/tmp/ai_is_speaking")

POLL_SECONDS = float(os.environ.get("VOICE_RESPONSE_AUDIO_POLL_SECONDS", "0.9"))
MAX_TAIL_CHARS = int(os.environ.get("VOICE_RESPONSE_AUDIO_MAX_TAIL_CHARS", "12000"))
MAX_SPEAK_CHARS = int(os.environ.get("VOICE_RESPONSE_AUDIO_MAX_SPEAK_CHARS", "420"))
MIN_SPEAK_CHARS = int(os.environ.get("VOICE_RESPONSE_AUDIO_MIN_SPEAK_CHARS", "28"))
POST_SPEECH_DELAY_SECONDS = float(
    os.environ.get("VOICE_RESPONSE_AUDIO_POST_DELAY_SECONDS", "0.30")
)
VOICE_NAME = os.environ.get("VOICE_RESPONSE_AUDIO_VOICE", "Daniel")

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


def read_target_tty(startup_tty: str | None) -> str | None:
    try:
        if TARGET_JSON_FILE.exists():
            payload = json.loads(TARGET_JSON_FILE.read_text(encoding="utf-8"))
            if payload.get("kind") == "terminal":
                tty = str(payload.get("tty", "")).strip()
                if tty:
                    return os.path.basename(tty)
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
set targetTTY to "{quoted_tty}"
set clipChars to {int(max(3000, tail_chars))}
tell application "Terminal"
    repeat with w in windows
        repeat with t in tabs of w
            if tty of t is targetTTY then
                set tabText to contents of t
                set textLen to length of tabText
                if textLen > clipChars then
                    return text (textLen - clipChars + 1) thru textLen of tabText
                else
                    return tabText
                end if
            end if
        end repeat
    end repeat
end tell
return "{NO_TTY_MARKER}"
'''.strip()

    proc = subprocess.run(
        ["osascript"],
        input=script,
        text=True,
        capture_output=True,
        check=False,
    )
    if proc.returncode != 0:
        return ""

    output = proc.stdout or ""
    if NO_TTY_MARKER in output:
        return ""
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
    if NOISE_LINE_RE.fullmatch(stripped):
        return True
    lower = stripped.lower()
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


def build_speakable_chunk(delta: str) -> str:
    normalized = normalize_text(delta)
    lines = [ln.strip() for ln in normalized.splitlines() if ln.strip()]
    filtered = [ln for ln in lines if not is_noise_line(ln)]
    if not filtered:
        return ""
    chunk = " ".join(filtered)
    chunk = re.sub(r"\s+", " ", chunk).strip()
    if len(chunk) < MIN_SPEAK_CHARS:
        return ""
    return clip_for_speech(chunk, MAX_SPEAK_CHARS)


def speak(text: str) -> None:
    if not text:
        return
    AI_SPEAKING_FLAG.touch(exist_ok=True)
    try:
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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Watch terminal output and speak AI responses.")
    parser.add_argument(
        "--target-tty",
        default=os.environ.get("VOICE_TARGET_TTY", "").strip(),
        help="Preferred startup tty (example: ttys009).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    startup_tty = os.path.basename(args.target_tty) if args.target_tty else detect_current_tty()

    active_tty: str | None = None
    snapshot = ""
    last_spoken = ""

    while True:
        target_tty = read_target_tty(startup_tty)

        if target_tty != active_tty:
            active_tty = target_tty
            snapshot = ""
            last_spoken = ""
            if active_tty:
                snapshot = read_terminal_tail(active_tty, MAX_TAIL_CHARS)
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

        chunk = build_speakable_chunk(delta)
        if not chunk:
            time.sleep(POLL_SECONDS)
            continue

        if chunk == last_spoken:
            time.sleep(POLL_SECONDS)
            continue

        speak(chunk)
        last_spoken = chunk
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass

#!/usr/bin/env python3
"""Format user voice utterances with speaker routing tags (U2A)."""

from __future__ import annotations

import os
import random
import re
import sys
import time

U2A_RE = re.compile(r"^\[U2A\b[^\]]*\]\s*(.+)$", re.IGNORECASE)


def normalize_profile(raw: str | None) -> str:
    profile = (raw or "main").strip().lower()
    profile = re.sub(r"[^a-z0-9_-]+", "_", profile).strip("_")
    return profile or "main"


def default_speaker_name() -> str:
    for key in ("VOICE_SPEAKER_NAME", "USER", "LOGNAME"):
        value = os.environ.get(key, "").strip()
        if value:
            return value
    return "operator"


def default_speaker_id(speaker_name: str) -> str:
    explicit = os.environ.get("VOICE_SPEAKER_ID", "").strip()
    if explicit:
        return explicit
    token = re.sub(r"[^A-Z0-9]+", "_", speaker_name.upper()).strip("_") or "OPERATOR"
    return f"TNF:USER:{token}:001"


def format_user_utterance(
    text: str,
    *,
    profile: str | None = None,
    speaker_name: str | None = None,
    speaker_id: str | None = None,
) -> str:
    body = re.sub(r"\s+", " ", (text or "").strip())
    if not body:
        return ""

    resolved_profile = normalize_profile(profile or os.environ.get("VOICEBRIDGE_PROFILE", "main"))
    resolved_name = (speaker_name or default_speaker_name()).strip()
    resolved_id = (speaker_id or default_speaker_id(resolved_name)).strip()
    msg_id = f"{int(time.time())}-{os.getpid()}-{random.randint(0, 99999)}"
    return (
        f"[U2A from:{resolved_name} speaker:{resolved_id} profile:{resolved_profile} id:{msg_id}] "
        f"{body}"
    )


def body_for_injection(text: str) -> str:
    stripped = (text or "").strip()
    if not stripped:
        return ""
    match = U2A_RE.match(stripped)
    if match:
        return match.group(1).strip()
    return stripped


def parse_user_utterance(text: str) -> dict[str, str]:
    stripped = (text or "").strip()
    match = re.match(
        r"^\[U2A\b[^\]]*from:([^\s\]]+)[^\]]*speaker:([^\s\]]+)[^\]]*profile:([^\s\]]+)[^\]]*id:([^\s\]]+)\]\s*(.*)$",
        stripped,
        re.IGNORECASE | re.DOTALL,
    )
    if not match:
        return {
            "from": default_speaker_name(),
            "speaker": default_speaker_id(default_speaker_name()),
            "profile": normalize_profile(os.environ.get("VOICEBRIDGE_PROFILE", "main")),
            "id": "",
            "body": stripped,
            "tagged": stripped,
        }
    return {
        "from": match.group(1).strip(),
        "speaker": match.group(2).strip(),
        "profile": normalize_profile(match.group(3)),
        "id": match.group(4).strip(),
        "body": match.group(5).strip(),
        "tagged": stripped,
    }


if __name__ == "__main__":
    raw = " ".join(sys.argv[1:]).strip()
    if not raw and not sys.stdin.isatty():
        raw = sys.stdin.read().strip()
    tagged = format_user_utterance(raw)
    if tagged:
        print(tagged)

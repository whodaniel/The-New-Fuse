#!/usr/bin/env python3
"""Conversation chronicle for Voice Bridge — text spine with anchored voice input."""

from __future__ import annotations

import argparse
import glob
import json
import os
import re
import sys
import time
from typing import Any

DEFAULT_MAX_CONTEXT_TURNS = int(os.environ.get("VOICE_CHRONICLE_CONTEXT_TURNS", "2"))
DEFAULT_MAX_CONTEXT_CHARS = int(os.environ.get("VOICE_CHRONICLE_CONTEXT_CHARS", "96"))
DEFAULT_MAX_SUMMARY_CHARS = int(os.environ.get("VOICE_CHRONICLE_SUMMARY_CHARS", "64"))
DEFAULT_MAX_ANCHOR_CHARS = int(os.environ.get("VOICE_CHRONICLE_ANCHOR_CHARS", "180"))
REJECTION_RE = re.compile(
    r"^(?:no(?:\s+no)+|nope|wrong|stop|not that|drop that|never mind|nevermind)\b",
    re.IGNORECASE,
)


def chronicle_anchor_mode() -> str:
    return os.environ.get("VOICE_CHRONICLE_ANCHOR_INJECT", "minimal").strip().lower()


def normalize_profile(raw: str | None) -> str:
    profile = (raw or "main").strip().lower()
    profile = re.sub(r"[^a-z0-9_-]+", "_", profile).strip("_")
    return profile or "main"


def profile_suffix(profile: str) -> str:
    normalized = normalize_profile(profile)
    if normalized in {"main", "default", "primary"}:
        return ""
    return f"_{normalized}"


def resolve_state_dir() -> str:
    explicit = os.environ.get("VOICEBRIDGE_STATE_DIR", "").strip()
    if explicit:
        return os.path.expanduser(explicit)

    env_root = (
        os.environ.get("VOICEBRIDGE_PROJECT_ROOT", "").strip()
        or os.environ.get("THE_NEW_FUSE_HOME", "").strip()
    )
    if env_root and os.path.isdir(env_root):
        return os.path.join(env_root, ".voicebridge")

    cur = os.getcwd()
    while cur and cur != "/":
        if os.path.basename(cur) == "The-New-Fuse" and os.path.isdir(os.path.join(cur, "apps")):
            return os.path.join(cur, ".voicebridge")
        parent = os.path.dirname(cur)
        if parent == cur:
            break
        cur = parent

    for candidate in (
        os.path.expanduser("~/The-New-Fuse"),
        os.path.expanduser("~/Desktop/The-New-Fuse"),
        os.path.expanduser("~/Projects/The-New-Fuse"),
    ):
        if os.path.isdir(candidate):
            return os.path.join(candidate, ".voicebridge")

    for pattern in (
        "~/Desktop/*/The-New-Fuse",
        "~/Projects/*/The-New-Fuse",
        "~/*/The-New-Fuse",
    ):
        for candidate in glob.glob(os.path.expanduser(pattern)):
            if os.path.isdir(os.path.join(candidate, "apps")):
                return os.path.join(candidate, ".voicebridge")

    return os.path.expanduser("~/.local/share/The-New-Fuse/.voicebridge")


def state_file_name(name: str, profile: str | None = None) -> str:
    suffix = profile_suffix(normalize_profile(profile or os.environ.get("VOICEBRIDGE_PROFILE", "main")))
    if not suffix:
        return name
    if "." in name:
        stem, ext = name.rsplit(".", 1)
        return f"{stem}{suffix}.{ext}"
    return f"{name}{suffix}"


def chronicle_paths(profile: str | None = None) -> tuple[str, str]:
    state_dir = resolve_state_dir()
    os.makedirs(state_dir, exist_ok=True)
    profile = normalize_profile(profile or os.environ.get("VOICEBRIDGE_PROFILE", "main"))
    log_name = state_file_name("conversation-chronicle.jsonl", profile)
    meta_name = state_file_name("conversation-chronicle-meta.json", profile)
    return os.path.join(state_dir, log_name), os.path.join(state_dir, meta_name)


def _read_meta(meta_path: str) -> dict[str, Any]:
    if not os.path.exists(meta_path):
        return {"turn": 0}
    try:
        with open(meta_path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    return {"turn": 0}


def _write_meta(meta_path: str, data: dict[str, Any]) -> None:
    tmp = f"{meta_path}.tmp"
    with open(tmp, "w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    os.replace(tmp, meta_path)


def _compact(text: str, max_chars: int) -> str:
    cleaned = re.sub(r"\s+", " ", (text or "").strip())
    if len(cleaned) <= max_chars:
        return cleaned
    return cleaned[: max_chars - 3].rstrip() + "..."


def _load_recent_turns(log_path: str, limit: int) -> list[dict[str, Any]]:
    if not os.path.exists(log_path):
        return []
    turns: list[dict[str, Any]] = []
    try:
        with open(log_path, "r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    item = json.loads(line)
                except Exception:
                    continue
                if isinstance(item, dict):
                    turns.append(item)
    except Exception:
        return []
    return turns[-limit:] if limit > 0 else turns


def _is_rejection(text: str) -> bool:
    return bool(REJECTION_RE.search((text or "").strip()))


def summarize_recent_turns(
    *,
    profile: str | None = None,
    max_turns: int = DEFAULT_MAX_CONTEXT_TURNS,
    max_chars: int = DEFAULT_MAX_CONTEXT_CHARS,
) -> str:
    log_path, _ = chronicle_paths(profile)
    recent = _load_recent_turns(log_path, max(max_turns * 4, 8))
    if not recent:
        return ""

    parts: list[str] = []
    for item in recent:
        if item.get("meta", {}).get("reject") or _is_rejection(str(item.get("text") or "")):
            parts = []
            continue

        role = str(item.get("role", "unknown"))
        channel = str(item.get("channel", "text"))
        if role == "assistant" and channel == "tts":
            continue

        summary = _compact(str(item.get("summary") or item.get("text") or ""), DEFAULT_MAX_SUMMARY_CHARS)
        if not summary:
            continue

        if role == "user":
            parts.append(summary)
        elif role == "assistant" and channel == "text":
            parts.append(summary)
        if len(parts) >= max_turns:
            parts = parts[-max_turns:]

    return _compact(" → ".join(parts), max_chars)


def chronicle_inject_context_path(profile: str | None = None) -> str:
    state_dir = resolve_state_dir()
    name = state_file_name("chronicle-inject-context.json", profile)
    return os.path.join(state_dir, name)


def write_inject_context(turn_id: int, user_text: str, thread_hint: str, profile: str | None = None) -> None:
    """Sidecar for agents: full relative context without bloating injected text."""
    context_path = chronicle_inject_context_path(profile)
    payload = {
        "turn": turn_id,
        "ts": time.time(),
        "user_text": user_text,
        "thread_hint": thread_hint,
    }
    tmp = f"{context_path}.tmp"
    with open(tmp, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    os.replace(tmp, context_path)


def append_turn(
    role: str,
    text: str,
    *,
    channel: str = "text",
    profile: str | None = None,
    meta: dict[str, Any] | None = None,
) -> int:
    log_path, meta_path = chronicle_paths(profile)
    body = (text or "").strip()
    if not body:
        return _read_meta(meta_path).get("turn", 0)

    state = _read_meta(meta_path)
    turn_id = int(state.get("turn", 0)) + 1
    state["turn"] = turn_id
    state["updated_at"] = time.time()
    _write_meta(meta_path, state)

    entry: dict[str, Any] = {
        "turn": turn_id,
        "ts": time.time(),
        "role": role,
        "channel": channel,
        "text": body,
        "summary": _compact(body, DEFAULT_MAX_SUMMARY_CHARS),
    }
    if meta:
        entry["meta"] = meta
    elif role == "user" and _is_rejection(body):
        entry["meta"] = {"reject": True}

    with open(log_path, "a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry, ensure_ascii=False) + "\n")

    return turn_id


def build_anchored_voice_prompt(
    user_text: str,
    *,
    profile: str | None = None,
    record: bool = True,
) -> str:
    cleaned = re.sub(r"\s+", " ", (user_text or "").strip())
    if not cleaned:
        return ""

    context = summarize_recent_turns(profile=profile)
    meta: dict[str, Any] | None = {"reject": True} if _is_rejection(cleaned) else None
    turn_id = (
        append_turn("user", cleaned, channel="voice", profile=profile, meta=meta)
        if record
        else None
    )

    if turn_id is not None:
        write_inject_context(turn_id, cleaned, context, profile=profile)

    if chronicle_anchor_mode() in {"0", "false", "no", "off", "none"}:
        return cleaned

    # minimal (default): tiny turn marker; thread lives in chronicle + inject sidecar
    if turn_id is not None:
        return f"[↑t{turn_id}] {cleaned}"
    return cleaned


def main() -> int:
    parser = argparse.ArgumentParser(description="Voice Bridge conversation chronicle")
    sub = parser.add_subparsers(dest="cmd", required=True)

    append_p = sub.add_parser("append", help="Append a chronicle turn")
    append_p.add_argument("--role", required=True, choices=["user", "assistant", "system"])
    append_p.add_argument("--channel", default="text", choices=["voice", "tts", "text", "system"])
    append_p.add_argument("--text", default="")
    append_p.add_argument("--stdin", action="store_true")
    append_p.add_argument("--profile", default=os.environ.get("VOICEBRIDGE_PROFILE", "main"))

    anchor_p = sub.add_parser("anchor", help="Build anchored voice prompt (records user turn)")
    anchor_p.add_argument("--text", required=True)
    anchor_p.add_argument("--no-record", action="store_true")
    anchor_p.add_argument("--profile", default=os.environ.get("VOICEBRIDGE_PROFILE", "main"))

    sub.add_parser("context", help="Print recent thread summary")
    sub.add_parser("tail", help="Print last few chronicle turns").add_argument(
        "-n", type=int, default=5
    )

    args = parser.parse_args()
    os.environ["VOICEBRIDGE_PROFILE"] = normalize_profile(args.profile if hasattr(args, "profile") else "main")

    if args.cmd == "append":
        text = args.text
        if args.stdin:
            stdin_text = sys.stdin.read()
            if stdin_text.strip():
                text = stdin_text
        turn_id = append_turn(args.role, text, channel=args.channel, profile=args.profile)
        print(json.dumps({"ok": True, "turn": turn_id}))
        return 0

    if args.cmd == "anchor":
        prompt = build_anchored_voice_prompt(
            args.text,
            profile=args.profile,
            record=not args.no_record,
        )
        print(prompt)
        return 0

    if args.cmd == "context":
        print(summarize_recent_turns(profile=os.environ.get("VOICEBRIDGE_PROFILE", "main")))
        return 0

    if args.cmd == "tail":
        log_path, _ = chronicle_paths()
        for item in _load_recent_turns(log_path, args.n):
            print(json.dumps(item, ensure_ascii=False))
        return 0

    return 1


if __name__ == "__main__":
    raise SystemExit(main())

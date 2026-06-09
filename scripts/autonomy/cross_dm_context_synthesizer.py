#!/usr/bin/env python3
"""Synthesize cross-DM conversation context for an agent from message history."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Sequence


def parse_time(value: Any) -> dt.datetime:
    if isinstance(value, (int, float)):
        return dt.datetime.fromtimestamp(float(value), tz=dt.timezone.utc)
    text = str(value or "").strip()
    if not text:
        return dt.datetime.fromtimestamp(0, tz=dt.timezone.utc)
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = dt.datetime.fromisoformat(text)
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=dt.timezone.utc)
    except ValueError:
        try:
            return dt.datetime.fromtimestamp(float(text), tz=dt.timezone.utc)
        except ValueError:
            return dt.datetime.fromtimestamp(0, tz=dt.timezone.utc)


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def as_records(payload: Any) -> List[Dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        for key in ("messages", "records", "items", "history"):
            if isinstance(payload.get(key), list):
                return [item for item in payload[key] if isinstance(item, dict)]
    raise ValueError("history JSON must be a list of message objects or contain messages/records/items/history")


def participants(message: Dict[str, Any]) -> set[str]:
    values = set()
    for key in ("user_id", "user", "sender", "sender_id", "actor_id", "recipient_id"):
        value = message.get(key)
        if value:
            values.add(str(value))
    for key in ("participants", "mentions", "direct_mentions"):
        raw = message.get(key)
        if isinstance(raw, list):
            values.update(str(item) for item in raw if item)
    return values


def message_text(message: Dict[str, Any]) -> str:
    return str(message.get("text") or message.get("content") or message.get("body") or "").strip()


def is_agent_participant(message: Dict[str, Any], agent_id: str) -> bool:
    if str(message.get("agent_id") or "") == agent_id:
        return True
    if str(message.get("bot_id") or "") == agent_id:
        return True
    if agent_id in participants(message):
        return True
    return f"<@{agent_id}>" in message_text(message)


def excluded(message: Dict[str, Any], excluded_contexts: set[str]) -> bool:
    haystack = " ".join(
        str(message.get(key) or "")
        for key in ("channel", "channel_id", "channel_name", "thread", "thread_ts", "context", "topic", "tags")
    ).lower()
    return any(token and token.lower() in haystack for token in excluded_contexts)


def synthesize_context(
    history: List[Dict[str, Any]],
    incoming_dm: Dict[str, Any],
    agent_id: str,
    lookback_hours: int,
    max_messages: int,
    excluded_contexts: Sequence[str],
) -> Dict[str, Any]:
    user_id = str(incoming_dm.get("user_id") or incoming_dm.get("user") or incoming_dm.get("sender_id") or "").strip()
    if not user_id:
        raise ValueError("incoming DM must include user_id/user/sender_id")

    incoming_time = parse_time(incoming_dm.get("timestamp") or incoming_dm.get("ts") or dt.datetime.now(dt.timezone.utc).isoformat())
    lower_bound = incoming_time - dt.timedelta(hours=lookback_hours)
    exclusions = {item.strip().lower() for item in excluded_contexts if item.strip()}

    selected: List[Dict[str, Any]] = []
    considered = 0
    for message in history:
        timestamp = parse_time(message.get("timestamp") or message.get("ts"))
        if timestamp > incoming_time or timestamp < lower_bound:
            continue
        considered += 1
        if user_id not in participants(message):
            continue
        if not is_agent_participant(message, agent_id):
            continue
        if excluded(message, exclusions):
            continue
        text = message_text(message)
        if not text:
            continue
        selected.append({**message, "_parsed_timestamp": timestamp.isoformat()})

    selected.sort(key=lambda item: item["_parsed_timestamp"])
    selected = selected[-max_messages:]
    lines = []
    for message in selected:
        speaker = str(message.get("speaker") or message.get("sender") or message.get("user_id") or "unknown")
        channel = str(message.get("channel_id") or message.get("channel") or "dm")
        lines.append(f"[{message['_parsed_timestamp']} {channel} {speaker}] {message_text(message)}")

    incoming_text = message_text(incoming_dm)
    context_string = "\n".join(lines)
    if context_string:
        context_string = f"Recent cross-DM context for user {user_id}:\n{context_string}\n\nIncoming DM:\n{incoming_text}"
    else:
        context_string = f"No relevant cross-DM context found for user {user_id}.\n\nIncoming DM:\n{incoming_text}"

    return {
        "user_id": user_id,
        "agent_id": agent_id,
        "context_string": context_string,
        "audit": {
            "lookbackHours": lookback_hours,
            "maxMessages": max_messages,
            "excludedContexts": sorted(exclusions),
            "incomingTimestamp": incoming_time.isoformat(),
            "lowerBound": lower_bound.isoformat(),
            "consideredMessages": considered,
            "selectedMessages": len(selected),
            "selectedRange": {
                "start": selected[0]["_parsed_timestamp"] if selected else None,
                "end": selected[-1]["_parsed_timestamp"] if selected else None,
            },
            "channels": sorted({str(item.get("channel_id") or item.get("channel") or "dm") for item in selected}),
        },
    }


def run_self_test() -> Dict[str, Any]:
    history = [
        {
            "timestamp": "2026-06-09T08:00:00Z",
            "channel_id": "D1",
            "user_id": "U123",
            "sender": "U123",
            "participants": ["U123", "victor"],
            "text": "Can you remember the onboarding issue from this morning?",
        },
        {
            "timestamp": "2026-06-09T08:05:00Z",
            "channel_id": "D1",
            "user_id": "U123",
            "sender": "victor",
            "participants": ["U123", "victor"],
            "text": "Yes, the blocker was missing permissions.",
        },
        {
            "timestamp": "2026-06-09T08:10:00Z",
            "channel_id": "growth-channel",
            "user_id": "U123",
            "sender": "U123",
            "participants": ["U123", "victor"],
            "text": "Ignore this growth channel context.",
        },
        {
            "timestamp": "2026-06-09T08:15:00Z",
            "channel_id": "D2",
            "user_id": "U999",
            "sender": "U999",
            "participants": ["U999", "victor"],
            "text": "Other user context.",
        },
    ]
    incoming = {
        "timestamp": "2026-06-09T09:00:00Z",
        "user_id": "U123",
        "text": "What was the blocker again?",
    }
    with tempfile.TemporaryDirectory() as directory:
        out = synthesize_context(history, incoming, "victor", 24, 50, ["growth-channel"])
        write_json(Path(directory) / "context.json", out)
    assert out["audit"]["selectedMessages"] == 2
    assert "missing permissions" in out["context_string"]
    assert "growth channel" not in out["context_string"].lower()
    return {"status": "passed", "audit": out["audit"]}


def main(argv: Sequence[str]) -> int:
    parser = argparse.ArgumentParser(description="Synthesize cross-DM context for an incoming agent DM")
    parser.add_argument("--history", help="JSON message history path")
    parser.add_argument("--incoming", help="Incoming DM JSON path")
    parser.add_argument("--agent-id", default="victor")
    parser.add_argument("--lookback-hours", type=int, default=24)
    parser.add_argument("--max-messages", type=int, default=50)
    parser.add_argument("--exclude", action="append", default=[])
    parser.add_argument("--output")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args(argv)

    if args.self_test:
        payload = run_self_test()
    else:
        if not args.history or not args.incoming:
            parser.error("--history and --incoming are required unless --self-test is used")
        payload = synthesize_context(
            as_records(read_json(Path(args.history))),
            read_json(Path(args.incoming)),
            args.agent_id,
            args.lookback_hours,
            args.max_messages,
            args.exclude,
        )

    if args.output:
        write_json(Path(args.output), payload)
    else:
        print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(__import__("sys").argv[1:]))

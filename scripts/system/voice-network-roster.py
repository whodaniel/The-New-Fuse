#!/usr/bin/env python3
"""TNF voice network roster — live agent TTYs for Inky front-door status."""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys


AGENT_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("cursor-agent", re.compile(r"(^|[/\s])cursor-agent([/\s]|$)|\.local/share/cursor-agent/")),
    ("tnf-cli", re.compile(r"packages/tnf-cli|\btnf-cli\b|tnf-agent-daemon|\btnf agent\b")),
    ("claude", re.compile(r"(^|[/\s])claude([/\s]|$)|\bclaude-code\b")),
    ("codex", re.compile(r"(^|[/\s])codex([/\s]|$)")),
    ("gemini", re.compile(r"(^|[/\s])gemini([/\s]|$)")),
    ("hermes", re.compile(r"(^|[/\s])hermes([/\s]|$)|\.hermes/hermes-agent")),
    ("openclaw", re.compile(r"(^|[/\s])openclaw([/\s]|$)")),
    ("pi", re.compile(r"(^|[/\s])pi([/\s]|$)")),
    ("aider", re.compile(r"(^|[/\s])aider([/\s]|$)")),
    ("kilo", re.compile(r"(^|[/\s])kilo([/\s]|$)|\bkilo-cli\b")),
    ("opencode", re.compile(r"(^|[/\s])opencode([/\s]|$)")),
]

DISPLAY_NAMES = {
    "cursor-agent": "Cursor Agent",
    "tnf-cli": "TNF CLI",
    "tnf-agent": "TNF Agent",
    "claude": "Claude Code",
    "codex": "Codex CLI",
    "gemini": "Gemini CLI",
    "hermes": "Hermes",
    "openclaw": "OpenClaw",
    "pi": "Pi",
    "aider": "Aider",
    "kilo": "Kilo",
    "opencode": "OpenCode",
}


def scan_agents() -> list[dict]:
    try:
        out = subprocess.check_output(
            ["ps", "axo", "pid=,tty=,command="],
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        return []

    found: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for line in out.splitlines():
        line = line.strip()
        if not line:
            continue
        parts = line.split(None, 2)
        if len(parts) < 3:
            continue
        pid_s, tty, cmd = parts
        if not tty or tty in {"??", "-"}:
            continue
        tty = tty.replace("/dev/", "")
        lower = cmd.lower()
        if "voice-network-roster" in lower or "voice-target-agent" in lower:
            continue
        for label, rx in AGENT_PATTERNS:
            if rx.search(cmd):
                key = (label, tty)
                if key in seen:
                    break
                seen.add(key)
                try:
                    pid = int(pid_s)
                except ValueError:
                    pid = 0
                found.append(
                    {
                        "id": label,
                        "name": DISPLAY_NAMES.get(label, label),
                        "tty": tty,
                        "pid": pid,
                        "command": cmd[:160],
                        "status": "active",
                    }
                )
                break
    found.sort(key=lambda a: (a["name"], a["tty"]))
    return found


def status_speech(agents: list[dict] | None = None) -> str:
    agents = agents if agents is not None else scan_agents()
    if not agents:
        return (
            "Inky here. I don't see any agent terminals active in the network right now. "
            "Start an agent in Terminal, or Cmd+Option+Click to set a destination."
        )
    parts = []
    for a in agents[:8]:
        parts.append(f"{a['name']} on {a['tty']}")
    listing = "; ".join(parts)
    more = ""
    if len(agents) > 8:
        more = f" Plus {len(agents) - 8} more."
    return (
        f"Inky here. {len(agents)} agent{'s' if len(agents) != 1 else ''} active: {listing}.{more}"
    )


def main() -> int:
    agents = scan_agents()
    payload = {
        "ok": True,
        "front_door": "inky",
        "count": len(agents),
        "agents": agents,
        "speech": status_speech(agents),
    }
    json.dump(payload, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

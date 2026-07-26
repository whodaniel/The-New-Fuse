#!/usr/bin/env python3
"""Human-friendly running record: who is who among TNF / CLI agents.

Writes:
  docs/protocols/AGENT_WHO_IS_WHO.md   — operator-readable
  .voicebridge/agent_who_is_who.json  — machine-readable snapshot

Usage:
  python3 scripts/system/tnf-agent-who-is-who.py
  python3 scripts/system/tnf-agent-who-is-who.py --write
  python3 scripts/system/tnf-agent-who-is-who.py --json
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path


def resolve_repo_root() -> Path:
    explicit = os.environ.get("VOICEBRIDGE_PROJECT_ROOT") or os.environ.get("THE_NEW_FUSE_HOME")
    if explicit:
        return Path(explicit).expanduser().resolve()
    here = Path(__file__).resolve()
    for parent in [here.parent, *here.parents]:
        if parent.name == "The-New-Fuse" and (parent / "apps").is_dir():
            return parent
    return Path.cwd()


REPO = resolve_repo_root()
MD_PATH = REPO / "docs" / "protocols" / "AGENT_WHO_IS_WHO.md"
JSON_PATH = REPO / ".voicebridge" / "agent_who_is_who.json"

# Stable glossary — what people mean when they say the common name.
GLOSSARY: list[dict] = [
    {
        "say": "Inky",
        "also": ["Enki", "front door"],
        "family": "TNF Voice",
        "what": "Audio front door / TTS persona — not a coding agent tty",
        "how": "Beam + KWS; say “hey Inky”",
        "id": "inky",
    },
    {
        "say": "Cursor",
        "also": ["Cursor Agent", "cursor-agent"],
        "family": "Cursor",
        "what": "Cursor’s terminal agent (this chat when voice-anchored here)",
        "how": "cursor-agent on a Terminal tty",
        "id": "cursor-agent",
    },
    {
        "say": "Claude",
        "also": ["Claude Code", "claude-code"],
        "family": "Anthropic",
        "what": "Claude Code CLI coding agent",
        "how": "`claude` / claude-code process on a tty",
        "id": "claude",
    },
    {
        "say": "Hermes",
        "also": ["Hermes Agent"],
        "family": "Hermes",
        "what": "Hermes Agent CLI (tools, sessions, optional TNF boot step)",
        "how": "`hermes` / ~/.hermes — not the same as Claude or OpenClaw",
        "id": "hermes",
    },
    {
        "say": "OpenClaw",
        "also": ["Open Claw", "Claw", "openclaw"],
        "family": "OpenClaw",
        "what": "Optional OpenClaw operator surface routed through TNF",
        "how": "`tnf openclaw` / `tnf claw` (prefer TNF routes first)",
        "id": "openclaw",
    },
    {
        "say": "TNF",
        "also": ["TNF CLI", "TNF TUI", "TNF Agent"],
        "family": "The New Fuse",
        "what": "Native TNF interactive agent (`tnf tui` / `tnf boot` attach)",
        "how": "packages/tnf-cli — boot vs tui are different windows",
        "id": "tnf-cli",
    },
    {
        "say": "Codex",
        "also": ["codex CLI"],
        "family": "OpenAI",
        "what": "OpenAI Codex CLI coding agent",
        "how": "`codex` on a tty",
        "id": "codex",
    },
    {
        "say": "Gemini",
        "also": ["Gemini CLI"],
        "family": "Google",
        "what": "Gemini CLI coding agent",
        "how": "`gemini` on a tty",
        "id": "gemini",
    },
    {
        "say": "Pi",
        "also": ["pi coding agent"],
        "family": "Pi",
        "what": "Pi terminal coding agent",
        "how": "`pi` on a tty",
        "id": "pi",
    },
    {
        "say": "Aider",
        "also": [],
        "family": "Aider",
        "what": "Aider pair-programming CLI",
        "how": "`aider` on a tty",
        "id": "aider",
    },
    {
        "say": "Kilo",
        "also": ["kilo-cli"],
        "family": "Kilo",
        "what": "Kilo CLI agent",
        "how": "`kilo` on a tty",
        "id": "kilo",
    },
    {
        "say": "OpenCode",
        "also": ["opencode"],
        "family": "OpenCode",
        "what": "OpenCode CLI agent",
        "how": "`opencode` on a tty",
        "id": "opencode",
    },
]

LIVE_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("cursor-agent", re.compile(r"(^|[/\s])cursor-agent([/\s]|$)|\.local/share/cursor-agent/")),
    ("tnf-cli", re.compile(r"packages/tnf-cli|\btnf-cli\b|tnf-agent-daemon|\btnf agent\b")),
    ("claude", re.compile(r"(^|[/\s])claude([/\s]|$)|\bclaude-code\b")),
    ("codex", re.compile(r"(^|[/\s])codex([/\s]|$)")),
    ("gemini", re.compile(r"(^|[/\s])gemini([/\s]|$)")),
    ("hermes", re.compile(r"(^|[/\s])hermes([/\s]|$)|\.hermes/hermes-agent")),
    ("openclaw", re.compile(r"(^|[/\s])openclaw([/\s]|$)|\bclaw\b.*agent")),
    ("pi", re.compile(r"(^|[/\s])pi([/\s]|$)")),
    ("aider", re.compile(r"(^|[/\s])aider([/\s]|$)")),
    ("kilo", re.compile(r"(^|[/\s])kilo([/\s]|$)|\bkilo-cli\b")),
    ("opencode", re.compile(r"(^|[/\s])opencode([/\s]|$)")),
]

DISPLAY = {g["id"]: g["say"] for g in GLOSSARY}


def scan_live() -> list[dict]:
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
        if "tnf-agent-who-is-who" in lower or "voice-network-roster" in lower:
            continue
        # Skip pure node/pnpm wrappers that aren't the agent itself when possible
        for label, rx in LIVE_PATTERNS:
            if not rx.search(cmd):
                continue
            # Avoid matching bare "pi" inside unrelated paths poorly — require word-ish
            if label == "pi" and not re.search(r"(^|[/\s])pi([/\s]|$)", cmd):
                continue
            key = (label, tty)
            if key in seen:
                break
            seen.add(key)
            try:
                pid = int(pid_s)
            except ValueError:
                pid = 0
            detail = ""
            if "tnf-cli" in label or label == "tnf-cli":
                if re.search(r"\btui\b", cmd):
                    detail = "TUI"
                elif re.search(r"\bboot\b", cmd):
                    detail = "boot"
            found.append(
                {
                    "id": label,
                    "name": DISPLAY.get(label, label),
                    "tty": tty,
                    "pid": pid,
                    "detail": detail,
                    "command": cmd[:180],
                    "status": "live",
                }
            )
            break
    found.sort(key=lambda a: (a["name"].lower(), a["tty"], -a["pid"]))
    return found


def read_voice_target() -> dict | None:
    path = REPO / ".voicebridge" / "voice_target.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def speech_summary(live: list[dict], target: dict | None) -> str:
    mixups = (
        "Quick mix-ups: Claude is Anthropic's coding CLI. "
        "Hermes is its own agent. OpenClaw is separate from both. "
        "Inky is the voice front door, not a coding agent."
    )
    if not live:
        live_bit = "No matched agent terminals are live right now."
    else:
        bits = []
        for a in live[:6]:
            note = f" {a['detail']}" if a.get("detail") else ""
            bits.append(f"{a['name']}{note} on {a['tty']}")
        live_bit = "Live now: " + "; ".join(bits) + "."
        if len(live) > 6:
            live_bit += f" Plus {len(live) - 6} more."
    anchor = "No voice anchor locked."
    if target and target.get("tty"):
        anchor = (
            f"Voice inject is on {target.get('app') or 'agent'} at {target.get('tty')}."
        )
    return f"Inky here. Agent who-is-who. {mixups} {live_bit} {anchor}"


def render_md(live: list[dict], target: dict | None) -> str:
    now = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M:%S %Z")
    lines: list[str] = []
    lines.append("# Agent Who-Is-Who")
    lines.append("")
    lines.append(
        "Human-friendly running record of **what people call an agent** vs **what it actually is**."
    )
    lines.append("")
    lines.append(f"_Last refreshed: **{now}**_")
    lines.append("")
    lines.append("Refresh anytime:")
    lines.append("")
    lines.append("```bash")
    lines.append("python3 scripts/system/tnf-agent-who-is-who.py --write")
    lines.append("# or: tnf agents who")
    lines.append("```")
    lines.append("")
    lines.append("## Name cheat sheet")
    lines.append("")
    lines.append("| When you say… | Also called | Family | What it is |")
    lines.append("|---|---|---|---|")
    for g in GLOSSARY:
        also = ", ".join(g["also"]) if g["also"] else "—"
        lines.append(
            f"| **{g['say']}** | {also} | {g['family']} | {g['what']} |"
        )
    lines.append("")
    lines.append("### Easy mix-ups")
    lines.append("")
    lines.append("- **Claude** ≠ **OpenClaw** — Claude is Anthropic’s coding CLI; OpenClaw is a separate operator surface.")
    lines.append("- **Hermes** ≠ **Claude** / **OpenClaw** — Hermes is its own agent runtime (`hermes`).")
    lines.append("- **TNF TUI** ≠ **Cursor Agent** — both can take voice, but they are different windows/ttys.")
    lines.append("- **Inky** is the voice front door / speaker, not a coding agent.")
    lines.append("")
    lines.append("## Live right now")
    lines.append("")
    if not live:
        lines.append("_No matched agent processes on a Terminal tty right now._")
    else:
        lines.append("| Name | Window (tty) | PID | Note |")
        lines.append("|---|---|---|---|")
        for a in live:
            note = a.get("detail") or "—"
            lines.append(
                f"| **{a['name']}** (`{a['id']}`) | `{a['tty']}` | {a['pid']} | {note} |"
            )
    lines.append("")
    lines.append("## Voice beam anchor")
    lines.append("")
    if target and target.get("tty"):
        app = target.get("app") or "?"
        tty = target.get("tty")
        locked = "locked" if target.get("locked") else "unlocked"
        lines.append(
            f"Speech inject goes to **`{app}`** on **`{tty}`** ({locked})."
        )
    else:
        lines.append("_No voice target locked._")
    lines.append("")
    lines.append("## How to aim voice")
    lines.append("")
    lines.append("- **Cmd+Option+Click** a Terminal tab — retarget beam")
    lines.append("- `voice-target-agent --prefer claude|hermes|cursor-agent|tnf|…`")
    lines.append("- Ask Inky to move the anchor")
    lines.append("")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="TNF agent who-is-who running record")
    parser.add_argument("--write", action="store_true", help="Write MD + JSON files")
    parser.add_argument("--json", action="store_true", help="Print JSON only")
    parser.add_argument(
        "--speak",
        action="store_true",
        help="Print (and optionally queue) a short spoken read-back",
    )
    parser.add_argument(
        "--queue-tts",
        action="store_true",
        help="With --speak, also queue Inky TTS via inky-say",
    )
    args = parser.parse_args()

    live = scan_live()
    target = read_voice_target()
    speech = speech_summary(live, target)
    payload = {
        "ok": True,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "glossary": GLOSSARY,
        "live": live,
        "voiceTarget": target,
        "speech": speech,
    }

    if args.speak:
        print(speech)
        if args.queue_tts:
            say = REPO / "scripts" / "system" / "inky-say"
            if say.exists():
                subprocess.run([str(say), speech], check=False)
        if not args.write and not args.json:
            return 0

    if args.json and not args.write:
        print(json.dumps(payload, indent=2))
        return 0

    md = render_md(live, target)
    if args.write or not args.json:
        if args.write:
            MD_PATH.parent.mkdir(parents=True, exist_ok=True)
            JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
            MD_PATH.write_text(md, encoding="utf-8")
            JSON_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
            print(f"Wrote {MD_PATH}")
            print(f"Wrote {JSON_PATH}")
        if not args.json and not args.speak:
            print(md)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

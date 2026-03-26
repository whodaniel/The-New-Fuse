#!/usr/bin/env python3
# stream_watch.py: Watches voice_stream.txt and injects new lines into a locked target destination.
# v9.0: Supports locked Terminal tty or locked app/window destination.

import argparse
import json
import os
import re
import subprocess
import sys
import time

STREAM_FILE = os.path.expanduser("~/.openclaw/voice_stream.txt")
TARGET_JSON_FILE = os.path.expanduser("~/.openclaw/voice_target.json")
LEGACY_TTY_FILE = os.path.expanduser("~/.openclaw/voice_target_tty")
POLL_INTERVAL_SECONDS = 0.15
IDLE_FLUSH_SECONDS = float(os.environ.get("VOICE_IDLE_FLUSH_SECONDS", "1.4"))
MAX_FLUSH_SECONDS = float(os.environ.get("VOICE_MAX_FLUSH_SECONDS", "6.0"))


def applescript_quote(text: str) -> str:
    return '"' + text.replace("\\", "\\\\").replace('"', '\\"') + '"'


def detect_current_tty() -> str | None:
    for handle in (sys.stdin, sys.stdout, sys.stderr):
        try:
            tty = os.ttyname(handle.fileno())
            return os.path.basename(tty)
        except Exception:
            continue
    return None


def run_applescript(script: str) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["osascript"],
        input=script,
        text=True,
        capture_output=True,
        check=False,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def ensure_stream_file() -> None:
    if not os.path.exists(STREAM_FILE):
        os.makedirs(os.path.dirname(STREAM_FILE), exist_ok=True)
        open(STREAM_FILE, "w", encoding="utf-8").close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Watch ~/.openclaw/voice_stream.txt and inject into locked destination."
    )
    parser.add_argument(
        "--target-tty",
        default=os.environ.get("VOICE_TARGET_TTY", ""),
        help="Startup fallback tty (e.g. ttys009).",
    )
    return parser.parse_args()


def normalize_terminal_target(tty: str | None, press_enter: bool = True) -> dict | None:
    if not tty:
        return None
    return {
        "kind": "terminal",
        "tty": os.path.basename(tty),
        "press_enter": bool(press_enter),
    }


def load_target(startup_tty: str | None) -> dict | None:
    # Preferred: JSON target profile.
    try:
        if os.path.exists(TARGET_JSON_FILE):
            data = json.loads(open(TARGET_JSON_FILE, "r", encoding="utf-8").read())
            kind = data.get("kind")
            if kind == "terminal" and data.get("tty"):
                return {
                    "kind": "terminal",
                    "tty": os.path.basename(str(data.get("tty"))),
                    "press_enter": bool(data.get("press_enter", True)),
                }
            if kind == "app" and data.get("app"):
                return {
                    "kind": "app",
                    "app": str(data.get("app")),
                    "window": str(data.get("window", "")),
                    "press_enter": bool(data.get("press_enter", False)),
                }
            if kind == "point" and data.get("x") is not None and data.get("y") is not None:
                try:
                    x = int(data.get("x"))
                    y = int(data.get("y"))
                except Exception:
                    x = y = None
                if x is not None and y is not None:
                    return {
                        "kind": "point",
                        "x": x,
                        "y": y,
                        "app": str(data.get("app", "")),
                        "bundle_id": str(data.get("bundle_id", "")),
                        "press_enter": bool(data.get("press_enter", False)),
                    }
    except Exception:
        pass

    # Legacy tty lock.
    try:
        if os.path.exists(LEGACY_TTY_FILE):
            legacy_tty = open(LEGACY_TTY_FILE, "r", encoding="utf-8").read().strip()
            t = normalize_terminal_target(legacy_tty, press_enter=True)
            if t:
                return t
    except Exception:
        pass

    return normalize_terminal_target(startup_tty, press_enter=True)


def target_label(target: dict | None) -> str:
    if not target:
        return "frontmost app fallback"
    if target.get("kind") == "terminal":
        enter = "on" if target.get("press_enter", True) else "off"
        return f"terminal:{target.get('tty')} (enter {enter})"
    if target.get("kind") == "app":
        enter = "on" if target.get("press_enter", False) else "off"
        window = target.get("window", "")
        if window:
            return f"app:{target.get('app')} window:{window} (enter {enter})"
        return f"app:{target.get('app')} (enter {enter})"
    if target.get("kind") == "point":
        enter = "on" if target.get("press_enter", False) else "off"
        app = target.get("app", "")
        if app:
            return f"point:{target.get('x')},{target.get('y')} app:{app} (enter {enter})"
        return f"point:{target.get('x')},{target.get('y')} (enter {enter})"
    return "unknown"


def inject_into_terminal(text: str, tty: str, press_enter: bool) -> tuple[int, str]:
    q_text = applescript_quote(text)
    enter_stmt = "key code 36" if press_enter else ""
    script = f"""
    tell application "System Events"
        set priorApp to ""
        try
            set priorApp to name of first process whose frontmost is true
        end try
    end tell

    tell application "Terminal"
        set targetTTY to "{tty}"
        set foundTab to missing value
        set foundWindow to missing value
        repeat with w in windows
            repeat with t in tabs of w
                if tty of t is targetTTY then
                    set foundTab to t
                    set foundWindow to w
                    exit repeat
                end if
            end repeat
            if foundTab is not missing value then exit repeat
        end repeat

        if foundTab is not missing value then
            set selected of foundTab to true
            set index of foundWindow to 1
        else
            activate
        end if
        activate
    end tell

    delay 0.03
    set the clipboard to {q_text}
    tell application "System Events"
        keystroke "v" using command down
        {enter_stmt}
    end tell

    tell application "System Events"
        if priorApp is not "" and priorApp is not "Terminal" then
            try
                tell application priorApp to activate
            end try
        end if
    end tell
    """
    rc, out, err = run_applescript(script)
    return rc, err or out


def inject_into_app(text: str, app_name: str, window_name: str, press_enter: bool) -> tuple[int, str]:
    q_text = applescript_quote(text)
    q_app = applescript_quote(app_name)
    q_window = applescript_quote(window_name)
    enter_stmt = "key code 36" if press_enter else ""

    script = f"""
    tell application "System Events"
        set priorApp to ""
        try
            set priorApp to name of first process whose frontmost is true
        end try
    end tell

    set targetApp to {q_app}
    set targetWindow to {q_window}

    tell application targetApp to activate
    delay 0.05

    tell application "System Events"
        tell process targetApp
            if targetWindow is not "" then
                try
                    repeat with w in windows
                        if name of w contains targetWindow then
                            try
                                perform action "AXRaise" of w
                            end try
                            exit repeat
                        end if
                    end repeat
                end try
            end if

            keystroke "v" using command down
            {enter_stmt}
        end tell
    end tell

    tell application "System Events"
        if priorApp is not "" and priorApp is not targetApp then
            try
                tell application priorApp to activate
            end try
        end if
    end tell
    """
    rc, out, err = run_applescript(script)
    return rc, err or out


def inject_into_point(
    text: str,
    x: int,
    y: int,
    press_enter: bool,
    app_name: str,
    bundle_id: str,
) -> tuple[int, str]:
    q_text = applescript_quote(text)
    q_app = applescript_quote(app_name)
    q_bundle = applescript_quote(bundle_id)
    enter_stmt = "key code 36" if press_enter else ""

    script = f"""
    tell application "System Events"
        set priorApp to ""
        try
            set priorApp to name of first process whose frontmost is true
        end try
    end tell

    set targetApp to {q_app}
    set targetBundle to {q_bundle}

    if targetBundle is not "" then
        try
            tell application id targetBundle to activate
        on error
            if targetApp is not "" then
                try
                    tell application targetApp to activate
                end try
            end if
        end try
    else if targetApp is not "" then
        try
            tell application targetApp to activate
        end try
    end if

    delay 0.04
    set the clipboard to {q_text}
    do shell script "/usr/local/bin/cliclick c:{x},{y}"

    tell application "System Events"
        keystroke "v" using command down
        {enter_stmt}
    end tell

    tell application "System Events"
        if priorApp is not "" and priorApp is not targetApp then
            try
                tell application priorApp to activate
            end try
        end if
    end tell
    """
    rc, out, err = run_applescript(script)
    return rc, err or out


def normalize_batch_text(raw_text: str) -> str:
    text = " ".join(raw_text.splitlines()).strip()
    text = re.sub(r"\s+", " ", text)
    # Tighten punctuation spacing.
    text = re.sub(r"\s+([,.;!?])", r"\1", text)
    text = text.strip()
    if not text:
        return ""
    if text[0].isalpha():
        text = text[0].upper() + text[1:]
    if text[-1] not in ".!?":
        text += "."
    return text


def inject_text(text: str, target: dict | None) -> None:
    single_line = " ".join(text.splitlines()).strip()
    if not single_line:
        return

    print(f"📡 Beaming from file: {single_line}")

    if not target:
        print("⚠️ No destination lock set. Use voice-target-here or voice-target-pick.")
        return

    kind = target.get("kind")
    if kind == "terminal":
        rc, msg = inject_into_terminal(
            single_line,
            tty=str(target.get("tty", "")),
            press_enter=bool(target.get("press_enter", True)),
        )
        if rc != 0:
            print(f"❌ Terminal injection failed: {msg}")
        return

    if kind == "app":
        rc, msg = inject_into_app(
            single_line,
            app_name=str(target.get("app", "")),
            window_name=str(target.get("window", "")),
            press_enter=bool(target.get("press_enter", False)),
        )
        if rc != 0:
            print(f"❌ App injection failed: {msg}")
        return

    if kind == "point":
        rc, msg = inject_into_point(
            single_line,
            x=int(target.get("x", 0)),
            y=int(target.get("y", 0)),
            press_enter=bool(target.get("press_enter", False)),
            app_name=str(target.get("app", "")),
            bundle_id=str(target.get("bundle_id", "")),
        )
        if rc != 0:
            print(f"❌ Point injection failed: {msg}")
        return

    print(f"❌ Unknown target kind: {kind}")


def main() -> None:
    args = parse_args()
    startup_tty = args.target_tty.strip() or detect_current_tty()
    if startup_tty:
        startup_tty = os.path.basename(startup_tty)

    ensure_stream_file()
    print(f"🔍 Monitoring {STREAM_FILE}...")

    active_target = load_target(startup_tty)
    print(f"🎯 Active target: {target_label(active_target)}")

    pending_chunks: list[str] = []
    first_chunk_at: float | None = None
    last_chunk_at: float | None = None

    def flush_pending(reason: str) -> None:
        nonlocal pending_chunks, first_chunk_at, last_chunk_at, active_target
        if not pending_chunks:
            return
        batch_text = normalize_batch_text(" ".join(pending_chunks))
        chunk_count = len(pending_chunks)
        pending_chunks = []
        first_chunk_at = None
        last_chunk_at = None
        if not batch_text:
            return
        print(f"📦 Flushing {chunk_count} chunk(s) [{reason}]")
        inject_text(batch_text, active_target)

    with open(STREAM_FILE, "r", encoding="utf-8") as file_handle:
        file_handle.seek(0, os.SEEK_END)

        try:
            while True:
                now = time.time()

                latest_target = load_target(startup_tty)
                if latest_target != active_target:
                    flush_pending("retarget")
                    active_target = latest_target
                    print(f"🎯 Retargeted: {target_label(active_target)}")

                line = file_handle.readline()
                if not line:
                    if pending_chunks and last_chunk_at is not None:
                        idle_due = (now - last_chunk_at) >= IDLE_FLUSH_SECONDS
                        max_due = (
                            first_chunk_at is not None
                            and (now - first_chunk_at) >= MAX_FLUSH_SECONDS
                        )
                        if idle_due or max_due:
                            flush_pending("idle" if idle_due else "max-window")
                            continue
                    time.sleep(POLL_INTERVAL_SECONDS)
                    continue

                text = line.strip()
                if text:
                    pending_chunks.append(text)
                    if first_chunk_at is None:
                        first_chunk_at = now
                    last_chunk_at = now
        except KeyboardInterrupt:
            flush_pending("shutdown")
            print("\n👋 Bridge stopped.")


if __name__ == "__main__":
    main()

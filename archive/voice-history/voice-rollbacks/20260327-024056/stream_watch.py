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
OFFSET_STATE_FILE = os.path.expanduser("~/.openclaw/voice_stream.offset.json")
POLL_INTERVAL_SECONDS = 0.08
IDLE_FLUSH_SECONDS = float(os.environ.get("VOICE_IDLE_FLUSH_SECONDS", "0.25"))
MAX_FLUSH_SECONDS = float(os.environ.get("VOICE_MAX_FLUSH_SECONDS", "1.2"))
IDLE_FLUSH_SECONDS_TERMINAL = float(os.environ.get("VOICE_IDLE_FLUSH_SECONDS_TERMINAL", "0.25"))
MAX_FLUSH_SECONDS_TERMINAL = float(os.environ.get("VOICE_MAX_FLUSH_SECONDS_TERMINAL", "1.2"))
IDLE_FLUSH_SECONDS_ANCHORED = float(os.environ.get("VOICE_IDLE_FLUSH_SECONDS_ANCHORED", "2.0"))
MAX_FLUSH_SECONDS_ANCHORED = float(os.environ.get("VOICE_MAX_FLUSH_SECONDS_ANCHORED", "4.0"))
OSASCRIPT_TIMEOUT_SECONDS = float(os.environ.get("VOICE_OSASCRIPT_TIMEOUT_SECONDS", "2.0"))
OFFSET_SAVE_MIN_INTERVAL = float(os.environ.get("VOICE_OFFSET_SAVE_MIN_INTERVAL", "0.25"))
MAX_RESUME_BACKLOG_BYTES = int(os.environ.get("VOICE_MAX_RESUME_BACKLOG_BYTES", "65536"))
VOICE_ALLOW_FINDER_TARGET = os.environ.get("VOICE_ALLOW_FINDER_TARGET", "0").strip().lower() in {"1", "true", "yes", "on"}
VOICE_TERMINAL_ALLOW_CLIPBOARD_FALLBACK = os.environ.get("VOICE_TERMINAL_ALLOW_CLIPBOARD_FALLBACK", "0").strip().lower() in {"1", "true", "yes", "on"}
VOICE_AUTO_FOLLOW_FRONT_TERMINAL = os.environ.get("VOICE_AUTO_FOLLOW_FRONT_TERMINAL", "0").strip().lower() in {"1", "true", "yes", "on"}
VOICE_TERMINAL_FORCE_PRESS_ENTER = os.environ.get("VOICE_TERMINAL_FORCE_PRESS_ENTER", "1").strip().lower() in {"1", "true", "yes", "on"}
VOICE_ENABLE_LEGACY_TTY_FALLBACK = os.environ.get("VOICE_ENABLE_LEGACY_TTY_FALLBACK", "0").strip().lower() in {"1", "true", "yes", "on"}
VOICE_TERMINAL_TTY_WRITE_FOR_INTERACTIVE = os.environ.get("VOICE_TERMINAL_TTY_WRITE_FOR_INTERACTIVE", "1").strip().lower() in {"1", "true", "yes", "on"}
VOICE_MAX_PENDING_CHUNKS = int(os.environ.get("VOICE_MAX_PENDING_CHUNKS", "24"))
VOICE_INTERACTIVE_PRE_ESC = os.environ.get("VOICE_INTERACTIVE_PRE_ESC", "0").strip().lower() in {"1", "true", "yes", "on"}
VOICE_INTERACTIVE_CLEAR_LINE = os.environ.get("VOICE_INTERACTIVE_CLEAR_LINE", "0").strip().lower() in {"1", "true", "yes", "on"}
INTERACTIVE_TTY_HINTS = (
    "codex",
    "@openai/codex",
    "claude",
    "openclaw",
    "aider",
)


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
    try:
        proc = subprocess.run(
            ["osascript"],
            input=script,
            text=True,
            capture_output=True,
            check=False,
            timeout=OSASCRIPT_TIMEOUT_SECONDS,
        )
        return proc.returncode, proc.stdout.strip(), proc.stderr.strip()
    except subprocess.TimeoutExpired:
        return 124, "", f"osascript-timeout>{OSASCRIPT_TIMEOUT_SECONDS:.1f}s"


def frontmost_app_name() -> str:
    rc, out, _ = run_applescript(
        """
        tell application "System Events"
            try
                return name of first process whose frontmost is true
            end try
        end tell
        return ""
        """
    )
    if rc != 0:
        return ""
    return out.strip()


def frontmost_terminal_tty() -> str:
    rc, out, _ = run_applescript(
        """
        tell application "Terminal"
            try
                return tty of selected tab of front window
            end try
        end tell
        return ""
        """
    )
    if rc != 0:
        return ""
    tty = out.strip()
    if tty.startswith("/dev/"):
        tty = tty[len("/dev/") :]
    return tty


def is_frontmost_terminal_tty(target_tty: str) -> bool:
    script = f"""
    tell application "Terminal"
        try
            set t to tty of selected tab of front window
            if t is "{target_tty}" or t is "/dev/" & "{target_tty}" then
                return "YES"
            end if
        end try
    end tell
    return "NO"
    """
    rc, out, _ = run_applescript(script)
    return rc == 0 and out.strip() == "YES"


def ensure_stream_file() -> None:
    if not os.path.exists(STREAM_FILE):
        os.makedirs(os.path.dirname(STREAM_FILE), exist_ok=True)
        open(STREAM_FILE, "w", encoding="utf-8").close()


def load_offset_state() -> tuple[int, int] | None:
    try:
        if not os.path.exists(OFFSET_STATE_FILE):
            return None
        raw = open(OFFSET_STATE_FILE, "r", encoding="utf-8").read()
        data = json.loads(raw)
        inode = int(data.get("inode"))
        offset = int(data.get("offset"))
        if inode < 0 or offset < 0:
            return None
        return inode, offset
    except Exception:
        return None


def save_offset_state(inode: int, offset: int) -> None:
    try:
        os.makedirs(os.path.dirname(OFFSET_STATE_FILE), exist_ok=True)
        payload = {"inode": int(inode), "offset": int(max(0, offset))}
        temp_path = OFFSET_STATE_FILE + ".tmp"
        with open(temp_path, "w", encoding="utf-8") as handle:
            json.dump(payload, handle)
            handle.write("\n")
        os.replace(temp_path, OFFSET_STATE_FILE)
    except Exception:
        pass


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
                press_enter = bool(data.get("press_enter", True))
                if VOICE_TERMINAL_FORCE_PRESS_ENTER:
                    press_enter = True
                return {
                    "kind": "terminal",
                    "tty": os.path.basename(str(data.get("tty"))),
                    "press_enter": press_enter,
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

    # Optional legacy tty lock fallback.
    if VOICE_ENABLE_LEGACY_TTY_FALLBACK:
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
    press_enter_literal = "true" if press_enter else "false"
    failures: list[str] = []
    target_tty_dev = tty if str(tty).startswith("/dev/") else f"/dev/{tty}"
    target_tty_name = os.path.basename(target_tty_dev)

    def tty_write(payload_text: str, mode_label: str) -> tuple[int, str]:
        payload = payload_text + ("\r" if press_enter else "")
        try:
            with open(target_tty_dev, "wb", buffering=0) as tty_file:
                tty_file.write(payload.encode("utf-8", errors="ignore"))
            return 0, f"sent to {target_tty_name}; mode={mode_label}"
        except Exception as err:
            failures.append(f"{mode_label}:{err}")
            return 1, ""

    if VOICE_TERMINAL_TTY_WRITE_FOR_INTERACTIVE:
        try:
            proc_out = subprocess.check_output(
                ["ps", "-t", target_tty_name, "-o", "command="],
                text=True,
                stderr=subprocess.DEVNULL,
            ).lower()
        except Exception:
            proc_out = ""
        if any(hint in proc_out for hint in INTERACTIVE_TTY_HINTS):
            prefix = ""
            if VOICE_INTERACTIVE_PRE_ESC:
                prefix += "\x1b"
            if VOICE_INTERACTIVE_CLEAR_LINE:
                prefix += "\x15"
            rcw, msgw = tty_write(prefix + text, "tty-write-interactive")
            if rcw == 0:
                return rcw, msgw

    # Preferred non-intrusive path: do-script injection in locked tab.
    fallback_script = f"""
    tell application "Terminal"
        set payloadText to {q_text}
        set pressEnter to {press_enter_literal}
        if pressEnter then
            set payloadText to payloadText & (ASCII character 13)
        end if
        set targetTTY to "{tty}"
        set foundTab to missing value
        repeat with w in windows
            repeat with t in tabs of w
                set tabTTY to tty of t
                if tabTTY is targetTTY or tabTTY is "/dev/" & targetTTY then
                    set foundTab to t
                    exit repeat
                end if
            end repeat
            if foundTab is not missing value then exit repeat
        end repeat
        if foundTab is not missing value then
            do script payloadText in foundTab
        else
            error "target tty not found: " & targetTTY
        end if
    end tell
    """
    rc2, out2, err2 = run_applescript(fallback_script)
    if rc2 == 0:
        return 0, f"sent to {tty}; mode=do-script-background"
    failures.append("do-script:" + (err2 or out2 or "unknown-error"))

    # Secondary non-intrusive path: direct tty write.
    rcw, msgw = tty_write(text, "tty-write-fallback")
    if rcw == 0:
        return rcw, msgw

    # Optional legacy path: clipboard-based injection and focus hopping.
    if not VOICE_TERMINAL_ALLOW_CLIPBOARD_FALLBACK:
        return 1, " | ".join(failures)

    if is_frontmost_terminal_tty(tty):
        front_script = f"""
        set payloadText to {q_text}
        set pressEnter to {press_enter_literal}
        set the clipboard to payloadText
        do shell script "/usr/local/bin/cliclick kd:cmd t:v ku:cmd"
        if pressEnter then
            do shell script "/usr/local/bin/cliclick kp:return"
            delay 0.03
            do shell script "/usr/local/bin/cliclick kp:enter"
        end if
        """
        rc, out, err = run_applescript(front_script)
        if rc == 0:
            return 0, f"sent to {tty}; mode=cliclick-front"
        failures.append("cliclick-front:" + (err or out or "unknown-error"))

    focus_script = f"""
    tell application "System Events"
        set priorApp to ""
        try
            set priorApp to name of first process whose frontmost is true
        end try
    end tell

    tell application "Terminal"
        set payloadText to {q_text}
        set pressEnter to {press_enter_literal}
        set targetTTY to "{tty}"
        set foundTab to missing value
        set foundWindow to missing value
        repeat with w in windows
            repeat with t in tabs of w
                set tabTTY to tty of t
                if tabTTY is targetTTY or tabTTY is "/dev/" & targetTTY then
                    set foundTab to t
                    set foundWindow to w
                    exit repeat
                end if
            end repeat
            if foundTab is not missing value then exit repeat
        end repeat
        if foundTab is missing value then
            error "target tty not found: " & targetTTY
        end if
        set selected of foundTab to true
        set index of foundWindow to 1
        activate
    end tell

    delay 0.03
    set the clipboard to payloadText
    do shell script "/usr/local/bin/cliclick kd:cmd t:v ku:cmd"
    if pressEnter then
        do shell script "/usr/local/bin/cliclick kp:return"
        delay 0.03
        do shell script "/usr/local/bin/cliclick kp:enter"
    end if

    tell application "System Events"
        if priorApp is not "" and priorApp is not "Terminal" then
            try
                tell application priorApp to activate
            end try
        end if
    end tell
    """
    rch, outh, errh = run_applescript(focus_script)
    if rch == 0:
        return 0, f"sent to {tty}; mode=cliclick-focus-hop"
    failures.append("cliclick-focus-hop:" + (errh or outh or "unknown-error"))
    return 1, " | ".join(failures)


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




def is_finder_target(target: dict | None) -> bool:
    if not target:
        return False
    app_name = str(target.get("app", "")).strip().lower()
    bundle_id = str(target.get("bundle_id", "")).strip().lower()
    if app_name == "finder":
        return True
    if bundle_id == "com.apple.finder":
        return True
    return False


def should_block_target(target: dict | None) -> bool:
    if VOICE_ALLOW_FINDER_TARGET:
        return False
    return is_finder_target(target)

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


def inject_text(text: str, target: dict | None) -> bool:
    single_line = " ".join(text.splitlines()).strip()
    if not single_line:
        return False

    print(f"📡 Beaming from file: {single_line}")

    if not target:
        print("⚠️ No destination lock set. Use voice-target-here or voice-target-pick.")
        return False

    if should_block_target(target):
        print("🛡️ Blocked injection to Finder target. Retarget with voice-target-here or voice-target-pick.")
        return False

    kind = target.get("kind")
    if kind == "terminal":
        rc, msg = inject_into_terminal(
            single_line,
            tty=str(target.get("tty", "")),
            press_enter=bool(target.get("press_enter", True)),
        )
        if rc != 0:
            print(f"❌ Terminal injection failed: {msg}")
        else:
            print(f"✅ Terminal injection: {msg}")
        return rc == 0

    if kind == "app":
        rc, msg = inject_into_app(
            single_line,
            app_name=str(target.get("app", "")),
            window_name=str(target.get("window", "")),
            press_enter=bool(target.get("press_enter", False)),
        )
        if rc != 0:
            print(f"❌ App injection failed: {msg}")
        else:
            print(f"✅ App injection: {msg}")
        return rc == 0

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
        else:
            print(f"✅ Point injection: {msg}")
        return rc == 0

    print(f"❌ Unknown target kind: {kind}")
    return False


def resolve_effective_target(target: dict | None) -> tuple[dict | None, str | None]:
    if not target:
        return target, None
    if not VOICE_AUTO_FOLLOW_FRONT_TERMINAL:
        return target, None
    if target.get("kind") != "terminal":
        return target, None
    if frontmost_app_name() != "Terminal":
        return target, None

    front_tty = frontmost_terminal_tty()
    if not front_tty:
        return target, None
    locked_tty = os.path.basename(str(target.get("tty", "")))
    if not locked_tty or front_tty == locked_tty:
        return target, None

    override = dict(target)
    override["tty"] = front_tty
    return override, f"front tty {front_tty} overrides locked tty {locked_tty}"


def flush_thresholds_for_target(target: dict | None) -> tuple[float, float]:
    if target and target.get("kind") == "terminal":
        return IDLE_FLUSH_SECONDS_TERMINAL, MAX_FLUSH_SECONDS_TERMINAL
    if target and target.get("kind") in {"point", "app"}:
        return IDLE_FLUSH_SECONDS_ANCHORED, MAX_FLUSH_SECONDS_ANCHORED
    return IDLE_FLUSH_SECONDS, MAX_FLUSH_SECONDS


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
    pending_end_offset: int | None = None
    last_target_override_note = ""

    with open(STREAM_FILE, "r", encoding="utf-8") as file_handle:
        file_stat = os.fstat(file_handle.fileno())
        file_inode = int(file_stat.st_ino)
        file_size = int(file_stat.st_size)

        start_offset = file_size
        loaded_state = load_offset_state()
        if loaded_state is not None:
            saved_inode, saved_offset = loaded_state
            if saved_inode == file_inode:
                if saved_offset <= file_size:
                    backlog = file_size - saved_offset
                    if backlog <= MAX_RESUME_BACKLOG_BYTES:
                        start_offset = saved_offset
                    else:
                        start_offset = file_size
                        print(
                            f"↩️ Resume backlog {backlog}B exceeds "
                            f"{MAX_RESUME_BACKLOG_BYTES}B; starting at end."
                        )
                else:
                    start_offset = 0
                print(f"↩️ Resuming stream at byte {start_offset}.")
            else:
                print("↩️ Stream inode changed; starting at end.")
        else:
            print("↩️ No stream offset state found; starting at end.")

        file_handle.seek(start_offset)
        committed_offset = start_offset
        last_offset_save_at = 0.0

        def save_committed_offset(force: bool = False) -> None:
            nonlocal last_offset_save_at
            now = time.time()
            if not force and (now - last_offset_save_at) < OFFSET_SAVE_MIN_INTERVAL:
                return
            save_offset_state(file_inode, committed_offset)
            last_offset_save_at = now

        def flush_pending(reason: str) -> None:
            nonlocal pending_chunks, first_chunk_at, last_chunk_at, active_target, pending_end_offset, committed_offset, last_target_override_note
            if not pending_chunks:
                return

            batch_text = normalize_batch_text(" ".join(pending_chunks))
            chunk_count = len(pending_chunks)
            if not batch_text:
                pending_chunks = []
                first_chunk_at = None
                last_chunk_at = None
                if pending_end_offset is not None:
                    committed_offset = pending_end_offset
                    pending_end_offset = None
                    save_committed_offset()
                return

            print(f"📦 Flushing {chunk_count} chunk(s) [{reason}]")
            effective_target, override_note = resolve_effective_target(active_target)
            if override_note:
                if override_note != last_target_override_note:
                    print(f"🎯 {override_note}")
                last_target_override_note = override_note
            else:
                last_target_override_note = ""
            success = inject_text(batch_text, effective_target)
            if success:
                pending_chunks = []
                first_chunk_at = None
                last_chunk_at = None
                if pending_end_offset is not None:
                    committed_offset = pending_end_offset
                    pending_end_offset = None
                    save_committed_offset()
            else:
                print("🔁 Injection failed; keeping buffered chunks for retry.")
                now = time.time()
                first_chunk_at = first_chunk_at or now
                last_chunk_at = now

        try:
            while True:
                now = time.time()

                latest_target = load_target(startup_tty)
                if latest_target != active_target:
                    flush_pending("retarget")
                    active_target = latest_target
                    print(f"🎯 Retargeted: {target_label(active_target)}")

                line_start = file_handle.tell()
                line = file_handle.readline()
                if not line:
                    if pending_chunks and last_chunk_at is not None:
                        effective_target_for_timer, _ = resolve_effective_target(active_target)
                        idle_threshold, max_threshold = flush_thresholds_for_target(effective_target_for_timer)
                        idle_due = (now - last_chunk_at) >= idle_threshold
                        max_due = (
                            first_chunk_at is not None
                            and (now - first_chunk_at) >= max_threshold
                        )
                        if idle_due or max_due:
                            flush_pending("idle" if idle_due else "max-window")
                            continue
                    time.sleep(POLL_INTERVAL_SECONDS)
                    continue

                line_end = file_handle.tell()
                text = line.strip()
                if text:
                    pending_chunks.append(text)
                    if first_chunk_at is None:
                        first_chunk_at = now
                    last_chunk_at = now
                    pending_end_offset = line_end
                    if len(pending_chunks) >= VOICE_MAX_PENDING_CHUNKS:
                        flush_pending("chunk-cap")
                else:
                    if not pending_chunks:
                        committed_offset = line_end
                        save_committed_offset()
        except KeyboardInterrupt:
            flush_pending("shutdown")
            save_committed_offset(force=True)
            print("\n👋 Bridge stopped.")


if __name__ == "__main__":
    main()

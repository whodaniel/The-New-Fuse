#!/usr/bin/env python3
# stream_watch.py: Watches voice_stream.txt and injects new lines into a locked target destination.
# v9.0: Supports locked Terminal tty or locked app/window destination.

import argparse
import fcntl
import json
import os
import re
import signal
import subprocess
import sys
import time
import glob

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
    normalized = normalize_profile(profile)
    if normalized in {"b", "samantha"}:
        return "Samantha"
    return "Daniel"


VOICEBRIDGE_PROFILE = normalize_profile(
    profile_from_argv(os.environ.get("VOICEBRIDGE_PROFILE", "main"))
)
os.environ["VOICEBRIDGE_PROFILE"] = VOICEBRIDGE_PROFILE
PROFILE_SUFFIX = profile_suffix(VOICEBRIDGE_PROFILE)


def state_file_name(name: str) -> str:
    suffix = profile_suffix(VOICEBRIDGE_PROFILE)
    if not suffix:
        return name
    if "." in name:
        stem, ext = name.rsplit(".", 1)
        return f"{stem}{suffix}.{ext}"
    return f"{name}{suffix}"


def resolve_state_dir() -> str:
    explicit = os.environ.get("VOICEBRIDGE_STATE_DIR", "").strip()
    if explicit:
        return os.path.expanduser(explicit)

    env_root = os.environ.get("VOICEBRIDGE_PROJECT_ROOT", "").strip() or os.environ.get("THE_NEW_FUSE_HOME", "").strip()
    if env_root:
        root = os.path.expanduser(env_root)
        if os.path.isdir(root):
            return os.path.join(root, ".voicebridge")

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


STATE_DIR = resolve_state_dir()
LEGACY_STATE_DIR = os.path.expanduser("~/.openclaw")
os.makedirs(STATE_DIR, exist_ok=True)
for name in (
    "voice_stream.txt",
    "voice_target.json",
    "voice_target_tty",
    "voice_mic_paused",
    "voice_response_audio_enabled",
    "voice_bridge_cloud.env",
):
    src = os.path.join(LEGACY_STATE_DIR, name)
    dst = os.path.join(STATE_DIR, state_file_name(name))
    if os.path.exists(src) and not os.path.exists(dst):
        try:
            subprocess.run(["cp", src, dst], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass

STREAM_FILE = os.path.join(STATE_DIR, state_file_name("voice_stream.txt"))
TARGET_JSON_FILE = os.path.join(STATE_DIR, state_file_name("voice_target.json"))
LEGACY_TTY_FILE = os.path.join(STATE_DIR, state_file_name("voice_target_tty"))
POLL_INTERVAL_SECONDS = 0.15
IDLE_FLUSH_SECONDS = float(os.environ.get("VOICE_IDLE_FLUSH_SECONDS", "1.4"))
MAX_FLUSH_SECONDS = float(os.environ.get("VOICE_MAX_FLUSH_SECONDS", "6.0"))
A2A_SPEAK_ENABLED = os.environ.get("VOICE_A2A_SPEAK_ENABLED", "1").strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}
A2A_SPEAK_VOICE = os.environ.get("VOICE_A2A_SPEAK_VOICE", default_voice_for_profile(VOICEBRIDGE_PROFILE))
A2A_SPEAK_MAX_CHARS = int(os.environ.get("VOICE_A2A_SPEAK_MAX_CHARS", "260"))
A2A_SPEAK_HEARTBEAT = os.environ.get("VOICE_A2A_SPEAK_HEARTBEAT", "0").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}
A2A_INJECT_TO_TARGET = os.environ.get("VOICE_A2A_INJECT_TO_TARGET", "0").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}
A2A_SPEECH_LOCK_FILE = os.environ.get("VOICE_A2A_SPEECH_LOCK_FILE", "/tmp/codex_voice.lock")
A2A_SPEECH_LOCK_TIMEOUT_SECONDS = float(os.environ.get("VOICE_A2A_SPEECH_LOCK_TIMEOUT_SECONDS", "3.0"))
A2A_SPEECH_PID_FILE = os.environ.get("VOICE_A2A_SPEECH_PID_FILE", "/tmp/codex_voice.pid")
A2A_CUTOFF_ON_CONTENTION = os.environ.get("VOICE_A2A_CUTOFF_ON_CONTENTION", "1").strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}
A2A_CUTOFF_GRACE_SECONDS = float(os.environ.get("VOICE_A2A_CUTOFF_GRACE_SECONDS", "0.12"))
A2A_RE = re.compile(r"^\[A2A\b[^\]]*\]\s*(.+)$", re.IGNORECASE)
A2A_HEARTBEAT_RE = re.compile(r"\b(?:heartbeat|^hb\b|keep polling|continue polling)\b", re.IGNORECASE)
AI_SPEAKING_FLAG = os.path.join("/tmp", f"ai_is_speaking{PROFILE_SUFFIX}")
LAST_AI_SPEECH_TS_FILE = os.path.join("/tmp", f"voice_last_ai_speech_ts{PROFILE_SUFFIX}")
LAST_AI_SPEECH_TEXT_FILE = os.path.join("/tmp", f"voice_last_ai_speech_text{PROFILE_SUFFIX}")
TERMINAL_PRE_ESCAPE = os.environ.get("VOICE_TERMINAL_PRE_ESCAPE", "1").strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}
VOICE_NO_FOCUS_STEAL = os.environ.get("VOICE_NO_FOCUS_STEAL", "0").strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}
VOICE_TERMINAL_DIRECT_TTY_PRIMARY = os.environ.get(
    "VOICE_TERMINAL_DIRECT_TTY_PRIMARY", "0"
).strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}
VOICE_TERMINAL_DIRECT_TTY_BACKGROUND = os.environ.get(
    "VOICE_TERMINAL_DIRECT_TTY_BACKGROUND", "0"
).strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}
VOICE_USE_KEYSTROKE = os.environ.get("VOICE_USE_KEYSTROKE", "1").strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}


def applescript_quote(text: str) -> str:
    return '"' + text.replace("\\", "\\\\").replace('"', '\\"') + '"'


def normalize_tty_name(tty: str | None) -> str:
    raw = (tty or "").strip()
    if raw.startswith("/dev/"):
        raw = raw[len("/dev/") :]
    return os.path.basename(raw)


def tty_device_path(tty: str | None) -> str:
    normalized = normalize_tty_name(tty)
    if not normalized:
        return ""
    return f"/dev/{normalized}"


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


def frontmost_terminal_tty() -> str:
    script = """
    tell application "Terminal"
        try
            return tty of selected tab of front window
        end try
    end tell
    return ""
    """
    rc, out, _ = run_applescript(script)
    if rc != 0:
        return ""
    return normalize_tty_name(out.strip())


def write_terminal_tty(tty: str, text: str, press_enter: bool) -> tuple[int, str]:
    tty_path = tty_device_path(tty)
    if not tty_path:
        return 1, "missing tty"

    payload = text + ("\r" if press_enter else "")
    data = payload.encode("utf-8", "replace")
    try:
        with open(tty_path, "wb", buffering=0) as tty_handle:
            tty_handle.write(data)
        return 0, f"sent to {os.path.basename(tty_path)}; mode=direct-tty"
    except Exception as exc:
        return 1, f"direct-tty failed on {tty_path}: {exc}"


def target_terminal_is_frontmost(tty: str) -> bool:
    front_tty = normalize_tty_name(frontmost_terminal_tty())
    target_tty = normalize_tty_name(tty)
    return bool(front_tty and target_tty and front_tty == target_tty)


def ensure_stream_file() -> None:
    if not os.path.exists(STREAM_FILE):
        os.makedirs(os.path.dirname(STREAM_FILE), exist_ok=True)
        open(STREAM_FILE, "w", encoding="utf-8").close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Watch voice stream file and inject into locked destination."
    )
    parser.add_argument(
        "--profile",
        default=VOICEBRIDGE_PROFILE,
        help="Voice bridge profile name (default: main).",
    )
    parser.add_argument(
        "--target-tty",
        default=os.environ.get("VOICE_TARGET_TTY", ""),
        help="Startup fallback tty (e.g. ttys009).",
    )
    return parser.parse_args()


def persist_anchor_tty_if_missing(tty: str) -> None:
    if not tty:
        return

    normalized_tty = os.path.basename(tty.strip())
    if not normalized_tty:
        return

    try:
        if not os.path.exists(TARGET_JSON_FILE):
            return
        with open(TARGET_JSON_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        kind = str(data.get("kind", ""))
        app_name = str(data.get("app", ""))
        bundle_id = str(data.get("bundle_id", ""))
        if kind not in {"point", "app"}:
            return
        if not is_terminal_like(app_name, bundle_id):
            return

        existing = os.path.basename(str(data.get("tty", "")).strip()) if data.get("tty") else ""
        if existing:
            return

        data["tty"] = normalized_tty
        data["updated_at"] = int(time.time())
        with open(TARGET_JSON_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

        try:
            with open(LEGACY_TTY_FILE, "w", encoding="utf-8") as f:
                f.write(normalized_tty + "\n")
        except Exception:
            pass

        print(f"🔒 Anchor enriched with tty: {normalized_tty}")
    except Exception:
        return


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
                    "tty": os.path.basename(str(data.get("tty", ""))).strip() if data.get("tty") else "",
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
                        "tty": os.path.basename(str(data.get("tty", ""))).strip() if data.get("tty") else "",
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
        tty = target.get("tty", "")
        window = target.get("window", "")
        if window and tty:
            return f"app:{target.get('app')} window:{window} tty:{tty} (enter {enter})"
        if window:
            return f"app:{target.get('app')} window:{window} (enter {enter})"
        if tty:
            return f"app:{target.get('app')} tty:{tty} (enter {enter})"
        return f"app:{target.get('app')} (enter {enter})"
    if target.get("kind") == "point":
        enter = "on" if target.get("press_enter", False) else "off"
        app = target.get("app", "")
        tty = target.get("tty", "")
        if app and tty:
            return f"point:{target.get('x')},{target.get('y')} app:{app} tty:{tty} (enter {enter})"
        if app:
            return f"point:{target.get('x')},{target.get('y')} app:{app} (enter {enter})"
        if tty:
            return f"point:{target.get('x')},{target.get('y')} tty:{tty} (enter {enter})"
        return f"point:{target.get('x')},{target.get('y')} (enter {enter})"
    return "unknown"


def is_terminal_like(app_name: str, bundle_id: str) -> bool:
    app = (app_name or "").strip().lower()
    bundle = (bundle_id or "").strip().lower()
    if "terminal" in app or "iterm" in app:
        return True
    if "com.apple.terminal" in bundle or "iterm" in bundle:
        return True
    return False


def inject_into_terminal(text: str, tty: str, press_enter: bool) -> tuple[int, str]:
    tty = normalize_tty_name(tty)
    if not tty:
        return 1, "missing tty"

    # Fast path: when both direct-tty modes are enabled, skip AppleScript
    # frontmost probing entirely and write directly to the tty device.
    if VOICE_TERMINAL_DIRECT_TTY_PRIMARY and VOICE_TERMINAL_DIRECT_TTY_BACKGROUND:
        rc, msg = write_terminal_tty(tty, text, press_enter)
        if rc == 0:
            return rc, msg
        if VOICE_NO_FOCUS_STEAL:
            return rc, msg

    target_is_frontmost = target_terminal_is_frontmost(tty)
    use_direct_tty = False
    if target_is_frontmost:
        use_direct_tty = VOICE_TERMINAL_DIRECT_TTY_PRIMARY
    else:
        use_direct_tty = VOICE_TERMINAL_DIRECT_TTY_BACKGROUND
    
    if VOICE_NO_FOCUS_STEAL and not target_is_frontmost:
        use_direct_tty = use_direct_tty or False # already handled by logic above

    if use_direct_tty:
        rc, msg = write_terminal_tty(tty, text, press_enter)
        if rc == 0:
            return rc, msg

    if VOICE_NO_FOCUS_STEAL and not target_is_frontmost:
        return 1, "skipped: target tty is not frontmost (VOICE_NO_FOCUS_STEAL=1)"

    q_text = applescript_quote(text)
    enter_stmt = "delay 0.06\nkey code 36" if press_enter else ""
    pre_escape_stmt = "key code 53\ndelay 0.02" if TERMINAL_PRE_ESCAPE else ""
    script = f"""
    tell application "System Events"
        set priorApp to ""
        try
            set priorApp to name of first process whose frontmost is true
        end try
    end tell

    tell application "Terminal"
        set targetTTYRaw to "{tty}"
        if targetTTYRaw starts with "/dev/" then
            set targetTTYDev to targetTTYRaw
        else
            set targetTTYDev to "/dev/" & targetTTYRaw
        end if
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

        if foundTab is not missing value then
            set selected of foundTab to true
            set index of foundWindow to 1
        else
            error "TTY_NOT_FOUND"
        end if
        activate
    end tell

    set the clipboard to {q_text}
    tell application "System Events"
        delay 0.03
        {pre_escape_stmt}
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
    enter_stmt = ""
    if press_enter:
        enter_stmt = "key code 36\ndelay 0.03\nkey code 76"

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

            if {1 if VOICE_USE_KEYSTROKE else 0} is 1 then
                keystroke {q_text}
            else
                set the clipboard to {q_text}
                keystroke "v" using command down
            end if
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
    enter_stmt = ""
    if press_enter:
        enter_stmt = "key code 36\ndelay 0.03\nkey code 76"

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
    do shell script "/usr/local/bin/cliclick c:{x},{y}"

    tell application "System Events"
        if {1 if VOICE_USE_KEYSTROKE else 0} is 1 then
            keystroke {q_text}
        else
            set the clipboard to {q_text}
            keystroke "v" using command down
        end if
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


def _read_active_speech_pid() -> int | None:
    try:
        raw = open(A2A_SPEECH_PID_FILE, "r", encoding="utf-8").read().strip()
    except Exception:
        return None
    if not raw:
        return None
    try:
        pid = int(raw)
    except Exception:
        return None
    return pid if pid > 0 else None


def _is_say_process(pid: int) -> bool:
    try:
        out = subprocess.check_output(
            ["ps", "-p", str(pid), "-o", "comm="],
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip().lower()
    except Exception:
        return False
    return out.endswith("/say") or out == "say"


def _stop_active_speech(reason: str) -> bool:
    pid = _read_active_speech_pid()
    if not pid:
        return False
    if not _is_say_process(pid):
        return False
    stopped = False
    try:
        os.kill(pid, signal.SIGTERM)
        stopped = True
        print(f"⏹️ [{VOICEBRIDGE_PROFILE}] Cutoff ({reason}): stopped active speech pid {pid}.")
    except Exception:
        return False
    if A2A_CUTOFF_GRACE_SECONDS > 0:
        time.sleep(A2A_CUTOFF_GRACE_SECONDS)
    try:
        os.kill(pid, 0)
        os.kill(pid, signal.SIGKILL)
        print(f"⏹️ [{VOICEBRIDGE_PROFILE}] Cutoff ({reason}): force-killed speech pid {pid}.")
    except Exception:
        pass
    return stopped


def maybe_speak_a2a(text: str) -> None:
    if not A2A_SPEAK_ENABLED or not text:
        return
    match = A2A_RE.match(text.strip())
    if not match:
        return

    body = re.sub(r"\s+", " ", match.group(1).strip())
    if not body:
        return
    if not A2A_SPEAK_HEARTBEAT and A2A_HEARTBEAT_RE.search(body):
        print(f"🔕 [{VOICEBRIDGE_PROFILE}] Suppressed heartbeat/control A2A speech.")
        return
    if len(body) > A2A_SPEAK_MAX_CHARS:
        body = body[:A2A_SPEAK_MAX_CHARS].rstrip() + "..."

    try:
        open(AI_SPEAKING_FLAG, "a", encoding="utf-8").close()
    except Exception:
        pass

    try:
        print(f"🔊 [{VOICEBRIDGE_PROFILE}] Speaking A2A ({A2A_SPEAK_VOICE}): {body[:120]}")
        lock_fh = None
        lock_acquired = False
        deadline = time.time() + max(0.1, A2A_SPEECH_LOCK_TIMEOUT_SECONDS)
        try:
            lock_fh = open(A2A_SPEECH_LOCK_FILE, "a", encoding="utf-8")
            while time.time() < deadline:
                try:
                    fcntl.flock(lock_fh.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                    lock_acquired = True
                    break
                except BlockingIOError:
                    if A2A_CUTOFF_ON_CONTENTION:
                        _stop_active_speech("lock-contention")
                    time.sleep(0.03)
                except Exception:
                    break
            say_proc = subprocess.Popen(
                ["say", "-v", A2A_SPEAK_VOICE, body],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            try:
                with open(A2A_SPEECH_PID_FILE, "w", encoding="utf-8") as f:
                    f.write(str(say_proc.pid))
                    f.write("\n")
            except Exception:
                pass
            say_proc.wait()
        finally:
            try:
                pid = _read_active_speech_pid()
                if pid:
                    with open(A2A_SPEECH_PID_FILE, "w", encoding="utf-8") as f:
                        f.write("")
            except Exception:
                pass
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
    finally:
        try:
            os.remove(AI_SPEAKING_FLAG)
        except FileNotFoundError:
            pass
        except Exception:
            pass
        try:
            with open(LAST_AI_SPEECH_TS_FILE, "w", encoding="utf-8") as f:
                f.write(f"{time.time():.6f}\n")
        except Exception:
            pass
        try:
            with open(LAST_AI_SPEECH_TEXT_FILE, "w", encoding="utf-8") as f:
                f.write(body)
                f.write("\n")
        except Exception:
            pass


def is_a2a_payload(text: str) -> bool:
    if not text:
        return False
    return bool(A2A_RE.match(text.strip()))


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
        tty = str(target.get("tty", "")).strip()
        if not tty:
            print("❌ Terminal target missing tty. Re-anchor with voice-target-here or Cmd+Option+Click.")
            return
        rc, msg = inject_into_terminal(
            single_line,
            tty=tty,
            press_enter=bool(target.get("press_enter", True)),
        )
        if rc != 0:
            print(f"❌ Terminal injection failed: {msg}")
        else:
            print(f"✅ Terminal injection succeeded: {msg}")
        return

    if kind == "app":
        app_name = str(target.get("app", ""))
        tty = str(target.get("tty", "")).strip()
        if is_terminal_like(app_name, "") and tty:
            rc, msg = inject_into_terminal(
                single_line,
                tty=tty,
                press_enter=True,
            )
            if rc != 0:
                print(f"❌ Terminal(app) injection failed: {msg}")
            else:
                print(f"✅ Terminal(app) injection succeeded via tty {tty}: {msg}")
                persist_anchor_tty_if_missing(tty)
            return
        
        # Fallback for Terminal without TTY, or non-terminal app
        if is_terminal_like(app_name, ""):
            print(f"⚠️ Terminal app target missing tty; falling back to generic app injection for {app_name}")
            
        rc, msg = inject_into_app(
            single_line,
            app_name=app_name,
            window_name=str(target.get("window", "")),
            press_enter=bool(target.get("press_enter", False)),
        )
        if rc != 0:
            print(f"❌ App injection failed: {msg}")
        else:
            print("✅ App injection succeeded.")
        return

    if kind == "point":
        app_name = str(target.get("app", ""))
        bundle_id = str(target.get("bundle_id", ""))
        tty = str(target.get("tty", "")).strip()
        if is_terminal_like(app_name, bundle_id) and tty:
            rc, msg = inject_into_terminal(
                single_line,
                tty=tty,
                press_enter=True,
            )
            if rc != 0:
                print(f"❌ Terminal(point) injection failed: {msg}")
            else:
                print(f"✅ Terminal(point) injection succeeded via tty {tty}: {msg}")
                persist_anchor_tty_if_missing(tty)
            return
        
        # Fallback for Terminal without TTY, or non-terminal app
        if is_terminal_like(app_name, bundle_id):
            print(f"⚠️ Terminal point target missing tty; falling back to generic point injection for {app_name}")

        rc, msg = inject_into_point(
            single_line,
            x=int(target.get("x", 0)),
            y=int(target.get("y", 0)),
            press_enter=bool(target.get("press_enter", False)),
            app_name=app_name,
            bundle_id=bundle_id,
        )
        if rc != 0:
            print(f"❌ Point injection failed: {msg}")
        else:
            print("✅ Point injection succeeded.")
        return

    print(f"❌ Unknown target kind: {kind}")


def main() -> None:
    args = parse_args()
    arg_profile = normalize_profile(args.profile)
    if arg_profile != VOICEBRIDGE_PROFILE:
        print(
            f"⚠️ Profile mismatch resolved to [{VOICEBRIDGE_PROFILE}] from argv/environment; "
            f"requested [{arg_profile}]",
        )
    startup_tty = args.target_tty.strip() or detect_current_tty()
    if startup_tty:
        startup_tty = os.path.basename(startup_tty)

    ensure_stream_file()
    print(f"🔍 [{VOICEBRIDGE_PROFILE}] Monitoring {STREAM_FILE}...")

    active_target = load_target(startup_tty)
    print(f"🎯 [{VOICEBRIDGE_PROFILE}] Active target: {target_label(active_target)}")

    pending_chunks: list[str] = []
    first_chunk_at: float | None = None
    last_chunk_at: float | None = None

    def flush_pending(reason: str) -> None:
        nonlocal pending_chunks, first_chunk_at, last_chunk_at, active_target
        if not pending_chunks:
            return
        queued_chunks = pending_chunks
        chunk_count = len(queued_chunks)
        pending_chunks = []
        first_chunk_at = None
        last_chunk_at = None

        # Keep conversational A2A and control/heartbeat A2A lines isolated.
        # If merged into one batch, a single control token can suppress the whole utterance.
        has_a2a = any(is_a2a_payload(chunk.strip()) for chunk in queued_chunks if chunk.strip())
        if has_a2a:
            print(f"📦 Flushing {chunk_count} chunk(s) [{reason}:a2a-split]")
            for raw in queued_chunks:
                text = normalize_batch_text(raw)
                if not text:
                    continue
                if is_a2a_payload(text) and not A2A_INJECT_TO_TARGET:
                    print(
                        f"🔇 [{VOICEBRIDGE_PROFILE}] A2A payload routed to audio only (no text injection)."
                    )
                    maybe_speak_a2a(text)
                else:
                    inject_text(text, active_target)
                    maybe_speak_a2a(text)
            return

        batch_text = normalize_batch_text(" ".join(queued_chunks))
        if not batch_text:
            return
        print(f"📦 Flushing {chunk_count} chunk(s) [{reason}]")
        inject_text(batch_text, active_target)
        maybe_speak_a2a(batch_text)

    with open(STREAM_FILE, "r", encoding="utf-8") as file_handle:
        file_handle.seek(0, os.SEEK_END)

        try:
            while True:
                now = time.time()

                # Recover if the stream file was truncated while this watcher was running.
                # Without this, the read cursor can remain beyond EOF and new lines are missed.
                try:
                    current_pos = file_handle.tell()
                    current_size = os.fstat(file_handle.fileno()).st_size
                    if current_size < current_pos:
                        flush_pending("stream-truncated")
                        file_handle.seek(0, os.SEEK_SET)
                        print(
                            f"♻️ [{VOICEBRIDGE_PROFILE}] Stream file truncated; reset read cursor.",
                        )
                except Exception:
                    pass

                latest_target = load_target(startup_tty)
                if latest_target != active_target:
                    flush_pending("retarget")
                    active_target = latest_target
                    print(f"🎯 [{VOICEBRIDGE_PROFILE}] Retargeted: {target_label(active_target)}")

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

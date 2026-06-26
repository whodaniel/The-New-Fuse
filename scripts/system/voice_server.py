from flask import Flask, request
import json
import os
import re
import signal
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import glob
import atexit
import traceback
import tempfile
import shutil

_SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))
if _SCRIPT_DIR not in sys.path:
    sys.path.insert(0, _SCRIPT_DIR)
from voice_user_tag import format_user_utterance, parse_user_utterance

app = Flask(__name__)

SUPERVISOR_LOG = os.environ.get("VOICE_SERVER_SUPERVISOR_LOG", "/tmp/voice_server_supervisor.log")


def supervisor_log(message: str) -> None:
    try:
        with open(SUPERVISOR_LOG, "a", encoding="utf-8") as f:
            f.write(f"{time.strftime('%Y-%m-%dT%H:%M:%S%z')} pid={os.getpid()} {message}\n")
    except Exception:
        pass


def log_shutdown_signal(signum, frame):
    supervisor_log(f"received signal {signum}")
    try:
        stack = "".join(traceback.format_stack(frame))[-4000:]
        supervisor_log(f"signal stack tail: {stack}")
    except Exception:
        pass
    sys.exit(128 + int(signum))


signal.signal(signal.SIGTERM, log_shutdown_signal)
signal.signal(signal.SIGINT, log_shutdown_signal)
atexit.register(lambda: supervisor_log("atexit"))


def voice_system_dir() -> str:
    env = os.environ.get("TNF_VOICE_SYSTEM_DIR", "").strip()
    if env and os.path.isdir(env):
        return env
    root = os.environ.get("VOICEBRIDGE_PROJECT_ROOT", "").strip()
    if root:
        candidate = os.path.join(root, "scripts", "system")
        if os.path.isfile(os.path.join(candidate, "voice_server.py")):
            return candidate
    fallback = os.path.expanduser("~/bin")
    return fallback if os.path.isdir(fallback) else candidate


def voice_system_path(name: str) -> str:
    return os.path.join(voice_system_dir(), name)


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


def port_from_argv(default: int) -> int:
    args = sys.argv[1:]
    i = 0
    while i < len(args):
        token = args[i]
        candidate = None
        if token == "--port":
            if i + 1 < len(args):
                candidate = args[i + 1]
        elif token.startswith("--port="):
            candidate = token.split("=", 1)[1]

        if candidate is not None:
            try:
                return int(candidate)
            except Exception:
                return default
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

default_port = int(os.environ.get("VOICEBRIDGE_PORT", "50005"))
VOICEBRIDGE_PORT = port_from_argv(default_port)
os.environ["VOICEBRIDGE_PORT"] = str(VOICEBRIDGE_PORT)


def state_file_name(name: str) -> str:
    if not PROFILE_SUFFIX:
        return name
    if "." in name:
        stem, ext = name.rsplit(".", 1)
        return f"{stem}{PROFILE_SUFFIX}.{ext}"
    return f"{name}{PROFILE_SUFFIX}"


def resolve_state_dir() -> str:
    explicit = os.environ.get("VOICEBRIDGE_STATE_DIR", "").strip()
    if explicit:
        return os.path.expanduser(explicit)

    env_root = (
        os.environ.get("VOICEBRIDGE_PROJECT_ROOT", "").strip()
        or os.environ.get("THE_NEW_FUSE_HOME", "").strip()
    )
    if env_root:
        root = os.path.expanduser(env_root)
        if os.path.isdir(root):
            return os.path.join(root, ".voicebridge")

    cur = os.getcwd()
    while cur and cur != "/":
        if os.path.basename(cur) == "The-New-Fuse" and os.path.isdir(
            os.path.join(cur, "apps")
        ):
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
            subprocess.run(
                ["cp", src, dst],
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except Exception:
            pass

STREAM_FILE = os.path.join(STATE_DIR, state_file_name("voice_stream.txt"))
MIC_PAUSE_FILE = os.path.join(STATE_DIR, state_file_name("voice_mic_paused"))
STREAM_WATCH_LOG = f"/tmp/stream_watch{PROFILE_SUFFIX}.log"
CLICK_DAEMON_LOG = "/tmp/voice_target_click.log"
RESPONSE_AUDIO_LOG = f"/tmp/voice_response_audio{PROFILE_SUFFIX}.log"
EVENT_LOG = []
KWS_INGEST_URL = os.environ.get("VOICE_KWS_INGEST_URL", "").strip()
KWS_FLUSH_URL = os.environ.get("VOICE_KWS_FLUSH_URL", "").strip()
KWS_API_KEY = os.environ.get("VOICE_KWS_API_KEY", "").strip()
KWS_INGEST_TIMEOUT_SECONDS = float(
    os.environ.get(
        "VOICE_KWS_INGEST_TIMEOUT_SECONDS",
        os.environ.get("VOICE_KWS_TIMEOUT_SECONDS", "3.0"),
    )
)
KWS_FLUSH_TIMEOUT_SECONDS = float(
    os.environ.get(
        "VOICE_KWS_FLUSH_TIMEOUT_SECONDS",
        os.environ.get("VOICE_KWS_TIMEOUT_SECONDS", "20.0"),
    )
)
KWS_FLUSH_INTERVAL_SECONDS = float(
    os.environ.get("VOICE_KWS_FLUSH_INTERVAL_SECONDS", "4.0")
)
KWS_STREAM_ID = os.environ.get("VOICE_KWS_STREAM_ID", "").strip()
KWS_LAST_FLUSH_TS = 0.0
KWS_LOCK = threading.Lock()
BRIDGE_LOCK = threading.Lock()
BRIDGE_WATCH_INTERVAL_SECONDS = float(
    os.environ.get("VOICE_BRIDGE_WATCH_INTERVAL_SECONDS", "5.0")
)
LAST_USER_INPUT_TS_FILE = f"/tmp/voice_last_user_input_ts{PROFILE_SUFFIX}"
LAST_USER_INPUT_TEXT_FILE = f"/tmp/voice_last_user_input_text{PROFILE_SUFFIX}"
LAST_AI_SPEECH_TS_FILE = f"/tmp/voice_last_ai_speech_ts{PROFILE_SUFFIX}"
LAST_AI_SPEECH_TEXT_FILE = f"/tmp/voice_last_ai_speech_text{PROFILE_SUFFIX}"
AI_SPEAKING_FLAG = f"/tmp/ai_is_speaking{PROFILE_SUFFIX}"
AI_POST_SPEECH_SUPPRESS_SECONDS = float(
    os.environ.get("VOICE_AI_POST_SPEECH_SUPPRESS_SECONDS", "1.6")
)
AI_ECHO_SUPPRESS_SECONDS = float(
    os.environ.get("VOICE_AI_ECHO_SUPPRESS_SECONDS", "8.0")
)
RESPONSE_AUDIO_AUTO_HEAL = os.environ.get(
    "VOICE_RESPONSE_AUDIO_AUTO_HEAL", "1"
).strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}
INTERRUPT_PHRASE_RE = re.compile(
    r"\b(stop|pause|wait|interrupt|hold on|quiet|be quiet|shut up|enough|cancel)\b",
    re.IGNORECASE,
)

if not KWS_STREAM_ID:
    host = os.uname().nodename if hasattr(os, "uname") else "host"
    normalized_host = re.sub(r"[^a-zA-Z0-9_-]", "-", host)
    KWS_STREAM_ID = f"voice_bridge_{normalized_host}_{os.getpid()}"


def python_script_pids(script_name: str, profile: str):
    normalized = normalize_profile(profile)
    pids = set()
    pgrep_bin = "/usr/bin/pgrep" if os.path.exists("/usr/bin/pgrep") else "pgrep"

    def collect(pattern: str) -> None:
        try:
            out = subprocess.check_output(
                [pgrep_bin, "-f", pattern],
                text=True,
                stderr=subprocess.DEVNULL,
            )
        except Exception:
            return

        for raw in out.splitlines():
            raw = raw.strip()
            if not raw:
                continue
            try:
                pid = int(raw)
            except ValueError:
                continue
            if pid == os.getpid():
                continue
            pids.add(pid)

    # Explicit profile workers.
    collect(rf"{re.escape(script_name)}.*--profile[ =]{re.escape(normalized)}")

    # Do not use broad pgrep for default profile: it overmatches profile-scoped
    # workers (a/b/...) and causes cross-profile churn. Default-profile
    # detection falls back to the command-parser path below, which only accepts
    # workers without any --profile flag.

    # Fallback path for environments where pgrep regex matching is flaky.
    if not pids:
        out = _read_process_commands()
        for raw in out.splitlines():
            line = raw.strip()
            if not line:
                continue
            parts = line.split(None, 1)
            if len(parts) != 2:
                continue
            pid_text, cmd = parts
            cmd_lower = cmd.lower()
            if script_name.lower() not in cmd_lower:
                continue
            if "python" not in os.path.basename(cmd.split()[0]).lower():
                continue

            has_profile_eq = f"--profile={normalized}" in cmd_lower
            has_profile_sp = f"--profile {normalized}" in cmd_lower
            if has_profile_eq or has_profile_sp:
                try:
                    pids.add(int(pid_text))
                except Exception:
                    pass
                continue

            if is_default_profile(normalized) and "--profile" not in cmd_lower:
                try:
                    pids.add(int(pid_text))
                except Exception:
                    pass

    return sorted(pids)


def _read_process_commands():
    try:
        out = subprocess.check_output(
            ["ps", "-Ao", "pid=,command="],
            text=True,
            stderr=subprocess.DEVNULL,
        )
        return out
    except Exception:
        return ""


def click_daemon_pids():
    pids = []
    out = _read_process_commands()
    if not out:
        return []
    daemon_bin = voice_system_path("voice-target-click-daemon")
    daemon_swift = voice_system_path("voice-target-click-daemon.swift")
    for line in out.splitlines():
        line = line.strip()
        if not line:
            continue
        parts = line.split(None, 1)
        if len(parts) != 2:
            continue
        pid_text, cmd = parts
        cmd_lower = cmd.lower()
        if cmd.startswith(daemon_bin) or ("swift" in cmd_lower and daemon_swift in cmd):
            try:
                pids.append(int(pid_text))
            except ValueError:
                continue
    return sorted(set(pids))


def prune_duplicate_pids(pids):
    if len(pids) <= 1:
        return pids, []

    keep = min(pids)
    killed = []
    for pid in pids:
        if pid == keep:
            continue
        try:
            os.kill(pid, signal.SIGTERM)
            killed.append(pid)
        except ProcessLookupError:
            continue
        except Exception:
            continue
    return [keep], killed


def spawn_background_process(cmd, log_path):
    with open(log_path, "ab", buffering=0) as log_file:
        subprocess.Popen(
            cmd,
            stdout=log_file,
            stderr=log_file,
            start_new_session=True,
        )


def ensure_background_bridge():
    started = []
    deduped = []

    with BRIDGE_LOCK:
        stream_pids, killed_stream = prune_duplicate_pids(
            python_script_pids("stream_watch.py", VOICEBRIDGE_PROFILE)
        )
        if killed_stream:
            deduped.append(f"stream_watch(-{len(killed_stream)})")
        if not stream_pids:
            spawn_background_process(
                [
                    "python3",
                    "-u",
                    voice_system_path("stream_watch.py"),
                    "--profile",
                    VOICEBRIDGE_PROFILE,
                ],
                STREAM_WATCH_LOG,
            )
            started.append("stream_watch")

        click_pids, killed_click = prune_duplicate_pids(click_daemon_pids())
        if killed_click:
            deduped.append(f"click_anchor_daemon(-{len(killed_click)})")
        if not click_pids:
            daemon_bin = voice_system_path("voice-target-click-daemon")
            daemon_script = voice_system_path("voice-target-click-daemon.swift")
            cmd = (
                [daemon_bin] if os.path.exists(daemon_bin) else ["swift", daemon_script]
            )
            spawn_background_process(cmd, CLICK_DAEMON_LOG)
            started.append("click_anchor_daemon")

        if RESPONSE_AUDIO_AUTO_HEAL:
            response_watcher_script = os.path.expanduser(
                voice_system_path("voice-response-audio-watch.py")
            )
            if os.path.exists(response_watcher_script):
                response_pids, killed_response = prune_duplicate_pids(
                    python_script_pids(
                        "voice-response-audio-watch.py", VOICEBRIDGE_PROFILE
                    )
                )
                if killed_response:
                    deduped.append(f"response_audio_watcher(-{len(killed_response)})")
                if not response_pids:
                    spawn_background_process(
                        [
                            "python3",
                            "-u",
                            response_watcher_script,
                            "--profile",
                            VOICEBRIDGE_PROFILE,
                        ],
                        RESPONSE_AUDIO_LOG,
                    )
                    started.append("response_audio_watcher")

    if deduped:
        log_event("DEDUPE", ", ".join(deduped))

    return started


def bridge_watchdog_loop():
    while True:
        try:
            started = ensure_background_bridge()
            if started:
                log_event("AUTO_HEAL", f"Restarted: {', '.join(started)}")
        except Exception as err:
            log_event("AUTO_HEAL_ERR", str(err)[:180])
        time.sleep(BRIDGE_WATCH_INTERVAL_SECONDS)


def start_bridge_watchdog():
    if BRIDGE_WATCH_INTERVAL_SECONDS <= 0:
        return None
    worker = threading.Thread(
        target=bridge_watchdog_loop,
        daemon=True,
        name=f"voice-bridge-watchdog-{VOICEBRIDGE_PROFILE}",
    )
    worker.start()
    return worker


def log_event(event_type, detail):
    timestamp = time.time()
    entry = {"time": timestamp, "type": event_type, "detail": detail}
    EVENT_LOG.append(entry)
    if len(EVENT_LOG) > 50:
        EVENT_LOG.pop(0)
    print(
        f"📊 [{time.strftime('%H:%M:%S', time.localtime(timestamp))}] "
        f"[{VOICEBRIDGE_PROFILE}] {event_type}: {detail}"
    )
    sys.stdout.flush()


def stop_active_speech(force: bool = False) -> bool:
    pgrep_bin = "/usr/bin/pgrep" if os.path.exists("/usr/bin/pgrep") else "pgrep"
    stopped = False
    for process_name in ("say", "afplay"):
        try:
            output = subprocess.check_output(
                [pgrep_bin, "-x", process_name],
                text=True,
                stderr=subprocess.DEVNULL,
            )
        except Exception:
            continue
        for raw in output.splitlines():
            raw = raw.strip()
            if not raw:
                continue
            try:
                pid = int(raw)
            except Exception:
                continue
            try:
                os.kill(pid, signal.SIGTERM)
                stopped = True
            except Exception:
                continue
    if stopped and not force:
        time.sleep(0.22)
        for process_name in ("say", "afplay"):
            try:
                output = subprocess.check_output(
                    [pgrep_bin, "-x", process_name],
                    text=True,
                    stderr=subprocess.DEVNULL,
                )
            except Exception:
                continue
            for raw in output.splitlines():
                raw = raw.strip()
                if not raw:
                    continue
                try:
                    os.kill(int(raw), signal.SIGKILL)
                except Exception:
                    continue
    return stopped


def is_mic_paused():
    return os.path.exists(MIC_PAUSE_FILE)


def set_mic_paused(paused: bool) -> None:
    if paused:
        with open(MIC_PAUSE_FILE, "a", encoding="utf-8"):
            pass
        os.utime(MIC_PAUSE_FILE, None)
    else:
        try:
            os.remove(MIC_PAUSE_FILE)
        except FileNotFoundError:
            pass


def is_interrupt_phrase(text: str) -> bool:
    if not text:
        return False
    return bool(INTERRUPT_PHRASE_RE.search(text))


def mark_user_input(text: str) -> None:
    now = time.time()
    try:
        with open(LAST_USER_INPUT_TS_FILE, "w", encoding="utf-8") as f:
            f.write(f"{now:.6f}\n")
    except Exception:
        pass
    try:
        with open(LAST_USER_INPUT_TEXT_FILE, "w", encoding="utf-8") as f:
            f.write(text)
    except Exception:
        pass


def read_last_ai_speech_ts() -> float:
    try:
        with open(LAST_AI_SPEECH_TS_FILE, "r", encoding="utf-8") as f:
            return float(f.read().strip() or "0")
    except Exception:
        return 0.0


def read_last_ai_speech_text() -> str:
    try:
        with open(LAST_AI_SPEECH_TEXT_FILE, "r", encoding="utf-8") as f:
            return " ".join(f.read().split())
    except Exception:
        return ""


def _tokenize_compare(text: str):
    return {
        tok for tok in re.findall(r"[a-z0-9]+", (text or "").lower()) if len(tok) >= 3
    }


def looks_like_ai_echo(candidate: str, spoken: str) -> bool:
    cand = _tokenize_compare(candidate)
    ref = _tokenize_compare(spoken)
    if not cand or not ref:
        return False
    overlap = len(cand & ref) / max(1, len(cand))
    return overlap >= 0.62


def post_json(url, payload, timeout_seconds):
    data = json.dumps(payload).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "voice-bridge/1.0 (+local-flask-forwarder)",
    }
    if KWS_API_KEY:
        headers["x-edge-api-key"] = KWS_API_KEY

    req = urllib.request.Request(url=url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout_seconds) as response:
        body = response.read().decode("utf-8", errors="replace")
        return response.getcode(), body


def maybe_forward_to_kws(parsed: dict):
    if not KWS_INGEST_URL:
        return

    body = str(parsed.get("body") or "").strip()
    if not body:
        return

    now = time.time()
    should_flush = False

    try:
        code, _ = post_json(
            KWS_INGEST_URL,
            {
                "streamId": KWS_STREAM_ID,
                "utterance": body,
                "speakerName": parsed.get("from", ""),
                "speakerId": parsed.get("speaker", ""),
                "profile": parsed.get("profile", ""),
                "utteranceId": parsed.get("id", ""),
                "routingTag": parsed.get("tagged", ""),
            },
            timeout_seconds=KWS_INGEST_TIMEOUT_SECONDS,
        )
        if code >= 400:
            log_event("KWS_INGEST_ERR", f"HTTP {code}")
            return
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", errors="replace")[:180]
        log_event("KWS_INGEST_ERR", f"HTTP {err.code}: {detail}")
        return
    except Exception as err:
        log_event("KWS_INGEST_ERR", str(err)[:180])
        return

    if KWS_FLUSH_URL:
        with KWS_LOCK:
            global KWS_LAST_FLUSH_TS
            if now - KWS_LAST_FLUSH_TS >= KWS_FLUSH_INTERVAL_SECONDS:
                KWS_LAST_FLUSH_TS = now
                should_flush = True

    if not should_flush:
        return

    try:
        code, _ = post_json(
            KWS_FLUSH_URL, {}, timeout_seconds=KWS_FLUSH_TIMEOUT_SECONDS
        )
        if code >= 400:
            log_event("KWS_FLUSH_ERR", f"HTTP {code}")
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", errors="replace")[:180]
        log_event("KWS_FLUSH_ERR", f"HTTP {err.code}: {detail}")
    except Exception as err:
        log_event("KWS_FLUSH_ERR", str(err)[:180])


def forward_to_kws_async(parsed: dict):
    worker = threading.Thread(target=maybe_forward_to_kws, args=(parsed,), daemon=True)
    worker.start()


WHISPER_MODEL_DIR = os.path.expanduser("~/.whisper-models")
WHISPER_MODEL_CANDIDATES = [
    os.environ.get("VOICE_WHISPER_MODEL", "").strip(),
    os.path.join(WHISPER_MODEL_DIR, "ggml-base.en.bin"),
    os.path.join(WHISPER_MODEL_DIR, "ggml-small.en.bin"),
    os.path.join(WHISPER_MODEL_DIR, "ggml-medium.en.bin"),
]
WHISPER_THREADS = os.environ.get("VOICE_WHISPER_THREADS", "4")
WHISPER_LANG = os.environ.get("VOICE_WHISPER_LANG", "en")


def resolve_whisper_cmd() -> str | None:
    bundled = os.path.join(voice_system_dir(), "whisper.cpp")
    candidates = []
    if os.path.isfile(bundled) and os.access(bundled, os.X_OK):
        candidates.append(bundled)
    for name in ("whisper-cli", "whisper-cpp", "whisper.cpp"):
        path = shutil.which(name)
        if path and path not in candidates:
            candidates.append(path)
    for path in candidates:
        try:
            probe = subprocess.run(
                [path, "-h"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=5,
                check=False,
            )
            if probe.returncode in (0, 1):
                return path
        except Exception:
            continue
    return None


def resolve_whisper_model() -> str | None:
    for candidate in WHISPER_MODEL_CANDIDATES:
        if candidate and os.path.isfile(candidate):
            return candidate
    return None


def whisper_stt_state() -> dict:
    return {
        "engine": "whisper.cpp",
        "cmd": resolve_whisper_cmd(),
        "model": resolve_whisper_model(),
        "ready": bool(resolve_whisper_cmd() and resolve_whisper_model()),
    }


def transcribe_wav_file(wav_path: str) -> str:
    cmd = resolve_whisper_cmd()
    model = resolve_whisper_model()
    if not cmd or not model:
        raise RuntimeError("whisper not configured")
    result = subprocess.run(
        [cmd, "-m", model, "-f", wav_path, "-t", WHISPER_THREADS, "-l", WHISPER_LANG, "-nt", "-np"],
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
        timeout=180,
        check=False,
    )
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "").strip()[:240]
        raise RuntimeError(detail or f"whisper exit {result.returncode}")
    return " ".join((result.stdout or "").split()).strip()


def transcribe_uploaded_audio(raw: bytes, content_type: str = "") -> str:
    if not raw or len(raw) < 400:
        return ""
    suffix = ".webm"
    lowered = (content_type or "").lower()
    if "wav" in lowered:
        suffix = ".wav"
    elif "ogg" in lowered:
        suffix = ".ogg"
    input_path = ""
    wav_path = ""
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as handle:
            handle.write(raw)
            input_path = handle.name
        if suffix == ".wav":
            return transcribe_wav_file(input_path)
        wav_path = f"{input_path}.16k.wav"
        ffmpeg = shutil.which("ffmpeg")
        if not ffmpeg:
            raise RuntimeError("ffmpeg not found")
        proc = subprocess.run(
            [ffmpeg, "-y", "-i", input_path, "-ar", "16000", "-ac", "1", wav_path],
            capture_output=True,
            text=True,
            check=False,
        )
        if proc.returncode != 0:
            detail = (proc.stderr or proc.stdout or "").strip()[:240]
            raise RuntimeError(detail or f"ffmpeg exit {proc.returncode}")
        return transcribe_wav_file(wav_path)
    finally:
        for path in (input_path, wav_path):
            if not path or not os.path.exists(path):
                continue
            try:
                os.remove(path)
            except OSError:
                pass


HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Gemini Unbreakable Link v7.1</title>
    <style>
        body { font-family: -apple-system, sans-serif; background: #000; color: #00ff00; display: flex; flex-direction: row; height: 100vh; margin: 0; overflow: hidden; }
        #left { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid #222; }
        #right { width: 450px; background: #0a0a0a; display: flex; flex-direction: column; padding: 15px; }
        #status { font-size: 28px; font-weight: bold; margin-bottom: 10px; color: #00ff00; }
        #ai-status { font-size: 18px; font-weight: bold; color: #ff00ff; display: none; margin-bottom: 10px; animation: glow 1.5s infinite; }
        #meter { width: 80%; height: 12px; background: #111; border-radius: 6px; overflow: hidden; margin-bottom: 20px; border: 1px solid #333; }
        #fill { width: 0%; height: 100%; background: #00ff00; transition: width 0.05s; box-shadow: 0 0 10px #00ff00; }
        #activate-btn { margin-top: 16px; background: #003300; color: #00ff99; border: 1px solid #00aa66; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-size: 14px; letter-spacing: 0.5px; }
        #activate-btn:hover { background: #004d33; }
        #activate-btn.beam-active { background: #003300; color: #00ff99; border-color: #00aa66; box-shadow: 0 0 12px #00aa66; }
        #activate-btn.beam-paused { background: #331a00; color: #ffcc66; border-color: #aa7700; box-shadow: none; }
        #activate-btn.beam-paused:hover { background: #4d2600; }
        #cache-list { flex: 1; overflow-y: auto; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #00cc00; border: 1px solid #333; padding: 15px; border-radius: 8px; background: #050505; }
        .cache-item { border-bottom: 1px solid #111; padding: 8px 0; line-height: 1.4; }
        .recording { color: #00ff00; text-shadow: 0 0 15px #00ff00; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
        @keyframes glow { 0% { text-shadow: 0 0 5px #ff00ff; } 50% { text-shadow: 0 0 20px #ff00ff; } 100% { text-shadow: 0 0 5px #ff00ff; } }
        h3 { font-size: 14px; margin: 0 0 15px 0; color: #00aa00; text-transform: uppercase; letter-spacing: 2px; display: flex; justify-content: space-between; }
        .btn-clear { background: #222; color: #666; border: 1px solid #333; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; }
        .btn-clear:hover { background: #333; color: #aaa; }
    </style>
</head>
<body>
    <div id="left">
        <div id="ai-status">🤖 AI IS SPEAKING...</div>
        <div id="status">UNBREAKABLE LINK v8.0</div>
        <div id="meter"><div id="fill"></div></div>
        <div id="text" style="color: #444; font-size: 14px;">Click to start the beam.</div>
        <button id="activate-btn" type="button">ACTIVATE BEAM</button>
    </div>
    <div id="right">
        <h3>
            Live Thought Stream
            <button class="btn-clear" onclick="clearStream()">Clear</button>
        </h3>
        <div id="cache-list"></div>
    </div>

    <script>
        const status = document.getElementById('status');
        const aiStatus = document.getElementById('ai-status');
        const fill = document.getElementById('fill');
        const cacheList = document.getElementById('cache-list');
        const infoText = document.getElementById('text');
        const activateBtn = document.getElementById('activate-btn');

        let isSpeaking = false;
        let wasSpeaking = false;
        let lastAiStopAtMs = 0;
        let micPaused = false;
        let userActivated = false;
        let prevMicPaused = null;
        let mediaStream = null;
        let audioContext = null;
        let analyser = null;
        let levelArray = null;
        let mediaRecorder = null;
        let recordingChunks = [];
        let isRecordingUtterance = false;
        let utteranceStartedAtMs = 0;
        let silenceStartedAtMs = 0;
        let vadRaf = null;
        let listeningActive = false;
        let transcribing = false;
        const VOICE_THRESHOLD = 11;
        const SILENCE_END_MS = 2400;
        const MIN_UTTERANCE_MS = 500;
        const MAX_UTTERANCE_MS = 18000;
        let lastSentText = '';
        let lastSentAtMs = 0;
        let lastInterruptAtMs = 0;
        const POST_AI_SUPPRESS_MS = 900;
        const INTERRUPT_COOLDOWN_MS = 350;
        const POST_INTERRUPT_TRANSCRIPT_SUPPRESS_MS = 1600;
        const MIN_BARGE_CHARS = 4;
        const INTERRUPT_RE = /\b(stop|pause|wait|interrupt|hold on|quiet|be quiet|shut up|enough|cancel)\b/i;

        async function checkAiStatus() {
            try {
                const resp = await fetch('/is_ai_speaking');
                const data = await resp.json();
                if (data.speaking) {
                    aiStatus.style.display = 'block';
                    isSpeaking = true;
                } else {
                    aiStatus.style.display = 'none';
                    if (wasSpeaking) {
                        lastAiStopAtMs = Date.now();
                    }
                    isSpeaking = false;
                }
                wasSpeaking = isSpeaking;
            } catch (e) {}
            setTimeout(checkAiStatus, 500);
        }

        function syncBeamButton() {
            if (!userActivated) {
                activateBtn.innerText = 'ACTIVATE BEAM';
                activateBtn.className = '';
                return;
            }
            if (micPaused) {
                activateBtn.innerText = 'BEAM PAUSED — CLICK TO RESUME';
                activateBtn.className = 'beam-paused';
            } else {
                activateBtn.innerText = 'BEAM ACTIVE — CLICK TO PAUSE';
                activateBtn.className = 'beam-active';
            }
        }

        function readMicLevel() {
            if (!analyser || !levelArray) return 0;
            analyser.getByteFrequencyData(levelArray);
            let sum = 0;
            for (let i = 0; i < levelArray.length; i++) sum += levelArray[i];
            return sum / levelArray.length;
        }

        function stopListening() {
            listeningActive = false;
            if (vadRaf) {
                cancelAnimationFrame(vadRaf);
                vadRaf = null;
            }
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                try { mediaRecorder.stop(); } catch (e) {}
            }
            isRecordingUtterance = false;
            recordingChunks = [];
            fill.style.width = '0%';
        }

        function recorderMimeType() {
            const candidates = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/ogg;codecs=opus',
                'audio/mp4'
            ];
            for (const type of candidates) {
                if (window.MediaRecorder && MediaRecorder.isTypeSupported(type)) {
                    return type;
                }
            }
            return '';
        }

        function startUtteranceRecording() {
            if (!mediaStream || isRecordingUtterance || transcribing || micPaused) return;
            const mimeType = recorderMimeType();
            if (!mimeType) {
                addCacheItem('[error] MediaRecorder not supported in this browser');
                return;
            }
            recordingChunks = [];
            mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) recordingChunks.push(event.data);
            };
            mediaRecorder.onstop = () => {
                if (recordingChunks.length > 0) {
                    const blob = new Blob(recordingChunks, { type: mimeType });
                    transcribeBlob(blob);
                }
                recordingChunks = [];
                isRecordingUtterance = false;
            };
            mediaRecorder.start(250);
            isRecordingUtterance = true;
            utteranceStartedAtMs = Date.now();
            silenceStartedAtMs = 0;
            infoText.innerText = 'Listening…';
        }

        function finishUtteranceRecording() {
            if (!isRecordingUtterance || !mediaRecorder) return;
            const elapsed = Date.now() - utteranceStartedAtMs;
            if (elapsed < MIN_UTTERANCE_MS) {
                try { mediaRecorder.stop(); } catch (e) {}
                isRecordingUtterance = false;
                recordingChunks = [];
                return;
            }
            infoText.innerText = 'Transcribing…';
            try { mediaRecorder.stop(); } catch (e) {}
        }

        async function transcribeBlob(blob) {
            if (!blob || blob.size < 400 || transcribing) return;
            transcribing = true;
            try {
                const resp = await fetch('/transcribe', {
                    method: 'POST',
                    headers: { 'Content-Type': blob.type || 'audio/webm' },
                    body: blob
                });
                const data = await resp.json();
                if (!resp.ok) {
                    throw new Error(data.error || ('HTTP ' + resp.status));
                }
                const cleaned = (data.text || '').trim();
                if (!cleaned) return;

                const now = Date.now();
                if (isSpeaking) {
                    const compactLen = cleaned.replace(/[^a-z0-9]/gi, '').length;
                    const shouldInterrupt = INTERRUPT_RE.test(cleaned) || compactLen >= MIN_BARGE_CHARS;
                    if (shouldInterrupt && (now - lastInterruptAtMs) >= INTERRUPT_COOLDOWN_MS) {
                        addCacheItem('[interrupt] ' + cleaned.slice(0, 80));
                        sendInterrupt(cleaned);
                        lastInterruptAtMs = now;
                    }
                    return;
                }
                if ((now - lastInterruptAtMs) < POST_INTERRUPT_TRANSCRIPT_SUPPRESS_MS) return;
                if ((now - lastAiStopAtMs) < POST_AI_SUPPRESS_MS) return;
                if (cleaned === lastSentText && (now - lastSentAtMs) < 3000) return;

                addCacheItem(cleaned);
                sendText(cleaned);
                lastSentText = cleaned;
                lastSentAtMs = now;
                infoText.innerText = 'Heard: ' + cleaned;
            } catch (e) {
                const msg = (e && e.message) ? e.message : String(e);
                addCacheItem('[error] transcribe: ' + msg);
                infoText.innerText = 'Transcribe error: ' + msg;
            } finally {
                transcribing = false;
                if (!micPaused && userActivated) {
                    infoText.innerText = 'Listening. Speak naturally, then pause.';
                }
            }
        }

        function vadLoop() {
            if (!listeningActive || micPaused || !userActivated) {
                vadRaf = requestAnimationFrame(vadLoop);
                return;
            }

            const level = readMicLevel();
            fill.style.width = Math.min(100, Math.max(4, level * 2.2)) + '%';
            const now = Date.now();
            const voice = level >= VOICE_THRESHOLD;

            if (voice) {
                silenceStartedAtMs = 0;
                if (!isRecordingUtterance && !transcribing && !isSpeaking) {
                    startUtteranceRecording();
                }
            } else if (isRecordingUtterance) {
                if (!silenceStartedAtMs) silenceStartedAtMs = now;
                const silentFor = now - silenceStartedAtMs;
                const utteranceFor = now - utteranceStartedAtMs;
                if (silentFor >= SILENCE_END_MS || utteranceFor >= MAX_UTTERANCE_MS) {
                    finishUtteranceRecording();
                }
            }

            vadRaf = requestAnimationFrame(vadLoop);
        }

        async function checkMicState() {
            try {
                const resp = await fetch('/mic_state');
                const data = await resp.json();
                micPaused = !!data.paused;
            } catch (e) {}

            if (prevMicPaused !== null && prevMicPaused !== micPaused) {
                if (micPaused) {
                    stopListening();
                } else if (userActivated) {
                    listeningActive = true;
                    vadLoop();
                }
            }
            prevMicPaused = micPaused;

            if (micPaused) {
                status.innerText = '⏸️ BEAM PAUSED';
                status.className = '';
                infoText.innerText = 'Beam paused. Click the button to resume.';
            } else if (userActivated) {
                status.innerText = listeningActive ? '📡 BEAM ACTIVE' : 'BEAM ACTIVE';
                status.className = 'recording';
                infoText.innerText = transcribing
                    ? 'Transcribing with local Whisper…'
                    : 'Listening with local Whisper. Speak, then pause.';
            } else {
                infoText.innerText = 'Click to start the beam.';
            }

            syncBeamButton();
            setTimeout(checkMicState, 500);
        }

        async function startRadar() {
            if (mediaStream) return;
            userActivated = true;

            try {
                await fetch('/activate', { method: 'POST' });
            } catch (e) {}

            const sttResp = await fetch('/stt_state');
            const stt = await sttResp.json();
            if (!stt.ready) {
                throw new Error('Local Whisper STT is not ready on this machine');
            }

            mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1
                }
            });

            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            levelArray = new Uint8Array(analyser.frequencyBinCount);
            const source = audioContext.createMediaStreamSource(mediaStream);
            source.connect(analyser);

            listeningActive = true;
            status.innerText = '📡 BEAM ACTIVE';
            status.className = 'recording';
            infoText.innerText = 'Local Whisper listening. Speak, then pause.';
            addCacheItem('[stt] local whisper ready');
            vadLoop();
        }

        function addCacheItem(text) {
            const div = document.createElement('div');
            div.className = 'cache-item';
            div.innerHTML = `<span style="color: #006600;">[${new Date().toLocaleTimeString()}]</span> ${text}`;
            cacheList.appendChild(div);
            cacheList.scrollTop = cacheList.scrollHeight;
        }

        function sendText(text) {
            fetch('/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text })
            });
        }

        function sendInterrupt(text) {
            fetch('/interrupt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: text || 'voice-interrupt' })
            });
        }

        function clearStream() {
            cacheList.innerHTML = '';
        }

        activateBtn.onclick = async () => {
            if (!userActivated) {
                try {
                    await startRadar();
                } catch (e) {
                    infoText.innerText = 'Mic error: ' + (e && e.message ? e.message : e) + ' — allow microphone in browser settings.';
                    addCacheItem('[error] startRadar: ' + (e && e.message ? e.message : e));
                    userActivated = false;
                }
                syncBeamButton();
                return;
            }
            const endpoint = micPaused ? '/mic_resume' : '/mic_pause';
            try {
                await fetch(endpoint, { method: 'POST' });
                const resp = await fetch('/mic_state');
                const data = await resp.json();
                micPaused = !!data.paused;
            } catch (e) {}
            syncBeamButton();
        };

        checkAiStatus();
        checkMicState();
    </script>
</body>
</html>
"""


@app.route("/")
def index():
    return HTML_TEMPLATE


@app.route("/is_ai_speaking")
def is_ai_speaking():
    return {"speaking": os.path.exists(AI_SPEAKING_FLAG)}


@app.route("/mic_state")
def mic_state():
    return {"paused": is_mic_paused()}


@app.route("/mic_pause", methods=["POST"])
def mic_pause():
    set_mic_paused(True)
    log_event("BEAM_PAUSE", "Beam paused via API")
    return {"ok": True, "paused": True}


@app.route("/mic_resume", methods=["POST"])
def mic_resume():
    set_mic_paused(False)
    log_event("BEAM_RESUME", "Beam resumed via API")
    return {"ok": True, "paused": False}


@app.route("/stt_state")
def stt_state():
    return whisper_stt_state()


@app.route("/transcribe", methods=["POST"])
def transcribe():
    if is_mic_paused():
        return {"error": "MIC_PAUSED"}, 423
    try:
        text = transcribe_uploaded_audio(
            request.get_data(),
            request.headers.get("Content-Type", ""),
        )
        text = " ".join((text or "").split())
        if text:
            log_event("STT", text[:60])
        return {"text": text}
    except Exception as err:
        log_event("STT_ERR", str(err)[:180])
        return {"error": str(err)}, 500


@app.route("/kws_state")
def kws_state():
    return {
        "enabled": bool(KWS_INGEST_URL),
        "ingest_url": KWS_INGEST_URL,
        "ingest_timeout_seconds": KWS_INGEST_TIMEOUT_SECONDS,
        "flush_url": KWS_FLUSH_URL,
        "flush_timeout_seconds": KWS_FLUSH_TIMEOUT_SECONDS,
        "flush_interval_seconds": KWS_FLUSH_INTERVAL_SECONDS,
        "stream_id": KWS_STREAM_ID,
        "has_api_key": bool(KWS_API_KEY),
    }


@app.route("/activate", methods=["POST"])
def activate():
    started = ensure_background_bridge()
    if started:
        log_event("ACTIVATE", f"Started: {', '.join(started)}")
    return {"ok": True, "started": started}


@app.route("/send", methods=["POST"])
def send():
    text = request.json.get("text", "")
    text = " ".join(text.split())

    if is_mic_paused():
        return "MIC_PAUSED"

    started = ensure_background_bridge()
    if started:
        log_event("AUTO_HEAL", f"Started during send: {', '.join(started)}")

    now_ts = time.time()
    last_ai_ts = read_last_ai_speech_ts()
    last_ai_text = read_last_ai_speech_text()
    ai_recent = (
        last_ai_ts > 0 and (now_ts - last_ai_ts) < AI_POST_SPEECH_SUPPRESS_SECONDS
    )
    ai_speaking = os.path.exists(AI_SPEAKING_FLAG) or ai_recent
    if ai_speaking and text:
        log_event("INTERRUPT", f"Voice barge-in via /send: {text[:60]}")
        stop_active_speech(force=False)
        try:
            os.remove(AI_SPEAKING_FLAG)
        except FileNotFoundError:
            pass
        time.sleep(0.15)

    if text and last_ai_ts > 0 and (now_ts - last_ai_ts) < AI_ECHO_SUPPRESS_SECONDS:
        if looks_like_ai_echo(text, last_ai_text):
            log_event("ECHO_SUPPRESS", text[:80])
            return "ECHO_SUPPRESSED"

    if text:
        tagged = format_user_utterance(text)
        parsed = parse_user_utterance(tagged)
        body = parsed.get("body") or text
        log_event("WRITING", body[:30])
        log_event(
            "U2A_TAG",
            f"from={parsed.get('from', '?')} speaker={parsed.get('speaker', '?')} profile={parsed.get('profile', '?')}",
        )
        mark_user_input(body)
        # Append tagged line for routing; stream_watch injects body only.
        with open(STREAM_FILE, "a") as f:
            f.write(tagged + "\n")
        forward_to_kws_async(parsed)
    return "OK"


@app.route("/interrupt", methods=["POST"])
def interrupt():
    payload = request.get_json(silent=True) or {}
    reason = " ".join(str(payload.get("reason", "")).split())[:160]
    stopped = False
    if os.path.exists(AI_SPEAKING_FLAG) or stop_active_speech(force=False):
        try:
            os.remove(AI_SPEAKING_FLAG)
        except FileNotFoundError:
            pass
        stopped = True
    if reason:
        log_event("INTERRUPT", f"Voice interrupt: {reason[:60]}")
    else:
        log_event("INTERRUPT", "Voice interrupt")
    return {"ok": True, "stopped": stopped}


@app.route("/ai_speaking", methods=["POST"])
def ai_speaking():
    # Placeholder for status sync
    return "OK"


if __name__ == "__main__":
    supervisor_log("main starting")
    try:
        os.makedirs(os.path.dirname(STREAM_FILE), exist_ok=True)
        print(f"🎛️ Voice server profile={VOICEBRIDGE_PROFILE} port={VOICEBRIDGE_PORT}")
        started = ensure_background_bridge()
        if started:
            log_event("BOOTSTRAP", f"Started: {', '.join(started)}")
        start_bridge_watchdog()
        if KWS_INGEST_URL:
            print(f"🔌 KWS forward enabled: stream_id={KWS_STREAM_ID}")
            print(f"   ingest={KWS_INGEST_URL} (timeout={KWS_INGEST_TIMEOUT_SECONDS:.1f}s)")
            if KWS_FLUSH_URL:
                print(
                    f"   flush={KWS_FLUSH_URL} every {KWS_FLUSH_INTERVAL_SECONDS:.1f}s "
                    f"(timeout={KWS_FLUSH_TIMEOUT_SECONDS:.1f}s)"
                )
        supervisor_log("app.run starting")
        app.run(host="127.0.0.1", port=VOICEBRIDGE_PORT, use_reloader=False, threaded=True)
        supervisor_log("app.run returned")
    except BaseException as err:
        supervisor_log(f"fatal {type(err).__name__}: {err}")
        try:
            supervisor_log(traceback.format_exc()[-4000:])
        except Exception:
            pass
        raise

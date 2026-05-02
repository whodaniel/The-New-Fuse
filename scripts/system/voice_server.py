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

app = Flask(__name__)


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
    daemon_bin = os.path.expanduser("~/bin/voice-target-click-daemon")
    daemon_swift = os.path.expanduser("~/bin/voice-target-click-daemon.swift")
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
                    os.path.expanduser("~/bin/stream_watch.py"),
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
            daemon_bin = os.path.expanduser("~/bin/voice-target-click-daemon")
            daemon_script = os.path.expanduser("~/bin/voice-target-click-daemon.swift")
            cmd = (
                [daemon_bin] if os.path.exists(daemon_bin) else ["swift", daemon_script]
            )
            spawn_background_process(cmd, CLICK_DAEMON_LOG)
            started.append("click_anchor_daemon")

        if RESPONSE_AUDIO_AUTO_HEAL:
            response_watcher_script = os.path.expanduser(
                "~/bin/voice-response-audio-watch.py"
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


def is_mic_paused():
    return os.path.exists(MIC_PAUSE_FILE)


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


def maybe_forward_to_kws(text):
    if not KWS_INGEST_URL:
        return

    now = time.time()
    should_flush = False

    try:
        code, _ = post_json(
            KWS_INGEST_URL,
            {"streamId": KWS_STREAM_ID, "utterance": text},
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


def forward_to_kws_async(text):
    worker = threading.Thread(target=maybe_forward_to_kws, args=(text,), daemon=True)
    worker.start()


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
        <div id="text" style="color: #444; font-size: 14px;">Press Activate once to start beam + bridge.</div>
        <button id="activate-btn">ACTIVATE BEAM</button>
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
        let recognition = null;
        let recognitionActive = false;
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

        async function checkMicState() {
            try {
                const resp = await fetch('/mic_state');
                const data = await resp.json();
                micPaused = !!data.paused;
            } catch (e) {}

            if (micPaused) {
                status.innerText = '🔇 MIC OFF';
                status.className = '';
                infoText.innerText = 'Mic paused. Run voice-mic-toggle to resume.';
                if (recognition && recognitionActive) {
                    try { recognition.stop(); } catch (e) {}
                }
            } else if (userActivated && recognition) {
                if (!recognitionActive && !isSpeaking) {
                    try { recognition.start(); } catch (e) {}
                }
            } else {
                infoText.innerText = 'Press Activate once to start beam + bridge.';
            }

            setTimeout(checkMicState, 500);
        }

        async function startRadar() {
            if (recognition) return;
            userActivated = true;

            // One-click activation: make sure bridge helpers are running.
            try {
                await fetch('/activate', { method: 'POST' });
            } catch (e) {}

            const context = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1
                }
            });
            const analyser = context.createAnalyser();
            analyser.fftSize = 256;
            const microphone = context.createMediaStreamSource(stream);
            microphone.connect(analyser);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            function checkVolume() {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                let average = sum / dataArray.length;
                fill.style.width = Math.min(100, average * 2) + '%';
                requestAnimationFrame(checkVolume);
            }
            checkVolume();

            recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                recognitionActive = true;
                if (!micPaused) {
                    status.innerText = '📡 BEAM ACTIVE';
                    status.className = 'recording';
                    infoText.innerText = 'Listening with batched auto-submit enabled.';
                }
            };

            recognition.onresult = (event) => {
                if (micPaused) return;

                let finalTranscript = '';
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const chunk = (event.results[i][0].transcript || '').trim();
                    if (!chunk) continue;
                    if (event.results[i].isFinal) {
                        finalTranscript += chunk + ' ';
                    } else {
                        interimTranscript += chunk + ' ';
                    }
                }

                const now = Date.now();
                if (isSpeaking) {
                    const bargeCandidate = (finalTranscript + ' ' + interimTranscript).trim();
                    if (!bargeCandidate) return;
                    const compactLen = bargeCandidate.replace(/[^a-z0-9]/gi, '').length;
                    const shouldInterrupt = INTERRUPT_RE.test(bargeCandidate) || compactLen >= MIN_BARGE_CHARS;
                    if (shouldInterrupt && (now - lastInterruptAtMs) >= INTERRUPT_COOLDOWN_MS) {
                        addCacheItem('[interrupt] ' + bargeCandidate.slice(0, 80));
                        sendInterrupt(bargeCandidate);
                        lastInterruptAtMs = now;
                        lastSentText = bargeCandidate;
                        lastSentAtMs = now;
                    }
                    return;
                }

                if ((now - lastInterruptAtMs) < POST_INTERRUPT_TRANSCRIPT_SUPPRESS_MS) {
                    return;
                }

                if (finalTranscript) {
                    const cleaned = finalTranscript.trim();
                    if (!cleaned) return;
                    if ((now - lastAiStopAtMs) < POST_AI_SUPPRESS_MS) {
                        return;
                    }

                    if (cleaned === lastSentText && (now - lastSentAtMs) < 3000) {
                        return;
                    }
                    addCacheItem(cleaned);
                    sendText(cleaned);
                    lastSentText = cleaned;
                    lastSentAtMs = now;
                }
            };

            recognition.onend = () => {
                recognitionActive = false;
                if (micPaused) return;
                if (!isSpeaking) {
                    try { recognition.start(); } catch (e) {}
                } else {
                    setTimeout(() => {
                        if (!micPaused) {
                            try { recognition.start(); } catch (e) {}
                        }
                    }, 1000);
                }
            };

            if (!micPaused) {
                recognition.start();
            }
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

        activateBtn.onclick = () => {
            if (!userActivated) {
                startRadar();
                activateBtn.disabled = true;
                activateBtn.innerText = 'BEAM ACTIVE';
            }
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
        os.system("pkill -9 afplay")
        os.system("pkill -9 say")
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
        log_event("WRITING", text[:30])
        mark_user_input(text)
        # Append to the unbreakable stream file
        with open(STREAM_FILE, "a") as f:
            f.write(text + "\n")
        forward_to_kws_async(text)
    return "OK"


@app.route("/interrupt", methods=["POST"])
def interrupt():
    payload = request.get_json(silent=True) or {}
    reason = " ".join(str(payload.get("reason", "")).split())[:160]
    stopped = False
    if os.path.exists(AI_SPEAKING_FLAG):
        os.system("pkill -9 afplay")
        os.system("pkill -9 say")
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
    app.run(host="127.0.0.1", port=VOICEBRIDGE_PORT)

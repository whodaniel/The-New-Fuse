from flask import Flask, request
import json
import os
import re
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request

app = Flask(__name__)

STREAM_FILE = os.path.expanduser("~/.openclaw/voice_stream.txt")
MIC_PAUSE_FILE = os.path.expanduser("~/.openclaw/voice_mic_paused")
STREAM_WATCH_LOG = "/tmp/stream_watch.log"
CLICK_DAEMON_LOG = "/tmp/voice_target_click.log"
EVENT_LOG = []
KWS_INGEST_URL = os.environ.get("VOICE_KWS_INGEST_URL", "").strip()
KWS_FLUSH_URL = os.environ.get("VOICE_KWS_FLUSH_URL", "").strip()
KWS_API_KEY = os.environ.get("VOICE_KWS_API_KEY", "").strip()
KWS_INGEST_TIMEOUT_SECONDS = float(
    os.environ.get("VOICE_KWS_INGEST_TIMEOUT_SECONDS", os.environ.get("VOICE_KWS_TIMEOUT_SECONDS", "3.0"))
)
KWS_FLUSH_TIMEOUT_SECONDS = float(
    os.environ.get("VOICE_KWS_FLUSH_TIMEOUT_SECONDS", os.environ.get("VOICE_KWS_TIMEOUT_SECONDS", "20.0"))
)
KWS_FLUSH_INTERVAL_SECONDS = float(os.environ.get("VOICE_KWS_FLUSH_INTERVAL_SECONDS", "4.0"))
KWS_STREAM_ID = os.environ.get("VOICE_KWS_STREAM_ID", "").strip()
KWS_LAST_FLUSH_TS = 0.0
KWS_LOCK = threading.Lock()
BRIDGE_HEAL_INTERVAL_SECONDS = float(os.environ.get("VOICE_BRIDGE_HEAL_INTERVAL_SECONDS", "10.0"))
BRIDGE_HEAL_LAST_TS = 0.0
BRIDGE_HEAL_LOCK = threading.Lock()
RAW_TRANSCRIPT_MODE = os.environ.get("VOICE_TRANSCRIPT_RAW", "1").strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}
CLICK_DAEMON_AUTO_START = os.environ.get("VOICE_CLICK_DAEMON_AUTO_START", "1").strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}
CLICK_DAEMON_PREFER_SWIFT = os.environ.get("VOICE_CLICK_DAEMON_PREFER_SWIFT", "0").strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}

if not KWS_STREAM_ID:
    host = os.uname().nodename if hasattr(os, "uname") else "host"
    normalized_host = re.sub(r"[^a-zA-Z0-9_-]", "-", host)
    KWS_STREAM_ID = f"voice_bridge_{normalized_host}_{os.getpid()}"


def _read_process_commands():
    try:
        return subprocess.check_output(
            ["ps", "-Ao", "pid=,command="],
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        return ""


def is_python_script_running(script_relpath):
    script_path = os.path.expanduser(script_relpath)
    out = _read_process_commands()
    if not out:
        return False
    for line in out.splitlines():
        line = line.strip()
        if not line:
            continue
        parts = line.split(None, 1)
        if len(parts) != 2:
            continue
        _, cmd = parts
        tokens = cmd.split()
        if len(tokens) < 2:
            continue
        exe = os.path.basename(tokens[0]).lower()
        if "python" in exe and script_path in cmd:
            return True
    return False


def is_click_daemon_running():
    daemon_bin = os.path.expanduser("~/bin/voice-target-click-daemon")
    daemon_swift = os.path.expanduser("~/bin/voice-target-click-daemon.swift")
    out = _read_process_commands()
    if not out:
        return False
    for line in out.splitlines():
        line = line.strip()
        if not line:
            continue
        parts = line.split(None, 1)
        if len(parts) != 2:
            continue
        _, cmd = parts
        if cmd.startswith(daemon_bin):
            return True
        if cmd.startswith("swift ") and daemon_swift in cmd:
            return True
    return False


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

    if not is_python_script_running("~/bin/stream_watch.py"):
        spawn_background_process(
            ["python3", "-u", os.path.expanduser("~/bin/stream_watch.py")],
            STREAM_WATCH_LOG,
        )
        started.append("stream_watch")

    if not is_python_script_running("~/bin/voice-response-audio-watch.py"):
        spawn_background_process(
            ["python3", "-u", os.path.expanduser("~/bin/voice-response-audio-watch.py")],
            "/tmp/voice_response_audio.log",
        )
        started.append("response_audio_watch")

    if CLICK_DAEMON_AUTO_START and not is_click_daemon_running():
        daemon_bin = os.path.expanduser("~/bin/voice-target-click-daemon")
        daemon_script = os.path.expanduser("~/bin/voice-target-click-daemon.swift")
        if os.path.exists(daemon_bin) and not CLICK_DAEMON_PREFER_SWIFT:
            cmd = [daemon_bin]
        else:
            cmd = ["swift", daemon_script]
        spawn_background_process(cmd, CLICK_DAEMON_LOG)
        started.append("click_anchor_daemon")

    return started


def maybe_ensure_background_bridge(force=False):
    global BRIDGE_HEAL_LAST_TS
    now = time.time()
    with BRIDGE_HEAL_LOCK:
        if not force and now - BRIDGE_HEAL_LAST_TS < BRIDGE_HEAL_INTERVAL_SECONDS:
            return []
        BRIDGE_HEAL_LAST_TS = now
    started = ensure_background_bridge()
    if started:
        log_event("BRIDGE_HEAL", f"Started: {', '.join(started)}")
    return started


def log_event(event_type, detail):
    timestamp = time.time()
    entry = {"time": timestamp, "type": event_type, "detail": detail}
    EVENT_LOG.append(entry)
    if len(EVENT_LOG) > 50: EVENT_LOG.pop(0)
    print(f"📊 [{time.strftime('%H:%M:%S', time.localtime(timestamp))}] {event_type}: {detail}")
    sys.stdout.flush()


def is_mic_paused():
    return os.path.exists(MIC_PAUSE_FILE)


TRANSCRIPTION_NORMALIZATION_RULES = (
    (re.compile(r"\bshark the pipeline\b", re.IGNORECASE), "shard the pipeline"),
    (re.compile(r"\bshower the model\b", re.IGNORECASE), "shard the model"),
    (re.compile(r"\bandal'?s law\b", re.IGNORECASE), "Amdahl's law"),
    (re.compile(r"\bextreme code design\b", re.IGNORECASE), "extreme co-design"),
    (re.compile(r"\bJensen Guam\b", re.IGNORECASE), "Jensen Huang"),
    (re.compile(r"\btext to speach\b", re.IGNORECASE), "text-to-speech"),
    (re.compile(r"\btext to audio\b", re.IGNORECASE), "text-to-audio"),
)


def normalize_transcript(text):
    if RAW_TRANSCRIPT_MODE:
        return (text or "").strip()

    cleaned = " ".join((text or "").split())
    for pattern, replacement in TRANSCRIPTION_NORMALIZATION_RULES:
        cleaned = pattern.sub(replacement, cleaned)
    return cleaned


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
        code, _ = post_json(KWS_FLUSH_URL, {}, timeout_seconds=KWS_FLUSH_TIMEOUT_SECONDS)
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
        let micPaused = false;
        let userActivated = false;
        let recognition = null;
        let recognitionActive = false;

        async function checkAiStatus() {
            try {
                const resp = await fetch('/is_ai_speaking');
                const data = await resp.json();
                if (data.speaking) {
                    aiStatus.style.display = 'block';
                    isSpeaking = true;
                } else {
                    aiStatus.style.display = 'none';
                    isSpeaking = false;
                }
            } catch (e) {}
            setTimeout(checkAiStatus, 120);
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

            setTimeout(checkMicState, 120);
        }

        async function startRadar() {
            if (recognition) return;
            userActivated = true;

            // One-click activation: make sure bridge helpers are running.
            try {
                await fetch('/activate', { method: 'POST' });
            } catch (e) {}

            const context = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript + ' ';
                    }
                }

                if (finalTranscript) {
                    const cleaned = finalTranscript.trim();
                    addCacheItem(cleaned);
                    sendText(cleaned);
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

@app.route('/')
def index():
    return HTML_TEMPLATE

@app.route('/is_ai_speaking')
def is_ai_speaking():
    return {'speaking': os.path.exists("/tmp/ai_is_speaking")}

@app.route('/mic_state')
def mic_state():
    maybe_ensure_background_bridge()
    return {'paused': is_mic_paused()}


@app.route('/kws_state')
def kws_state():
    return {
        'enabled': bool(KWS_INGEST_URL),
        'ingest_url': KWS_INGEST_URL,
        'ingest_timeout_seconds': KWS_INGEST_TIMEOUT_SECONDS,
        'flush_url': KWS_FLUSH_URL,
        'flush_timeout_seconds': KWS_FLUSH_TIMEOUT_SECONDS,
        'flush_interval_seconds': KWS_FLUSH_INTERVAL_SECONDS,
        'stream_id': KWS_STREAM_ID,
        'has_api_key': bool(KWS_API_KEY),
    }


@app.route('/activate', methods=['POST'])
def activate():
    started = maybe_ensure_background_bridge(force=True)
    if started:
        log_event("ACTIVATE", f"Started: {', '.join(started)}")
    return {'ok': True, 'started': started}

@app.route('/send', methods=['POST'])
def send():
    text = request.json.get('text', '')
    text = normalize_transcript(text)

    if is_mic_paused():
        return 'MIC_PAUSED'
    
    # Active Interruption: If user speaks, KILL the AI's audio immediately
    if os.path.exists("/tmp/ai_is_speaking"):
        log_event("INTERRUPT", "User is speaking over AI. Killing audio.")
        os.system("pkill -9 afplay")
        os.system("pkill -9 say")
        if os.path.exists("/tmp/ai_is_speaking"):
            os.remove("/tmp/ai_is_speaking")
        
    if text:
        log_event("WRITING", text[:30])
        # Append to the unbreakable stream file
        with open(STREAM_FILE, "a") as f:
            f.write(text + "\n")
        forward_to_kws_async(text)
    return 'OK'

@app.route('/interrupt', methods=['POST'])
def interrupt():
    # Simple volume pulse endpoint - no killing, just data
    return 'OK'

@app.route('/ai_speaking', methods=['POST'])
def ai_speaking():
    # Placeholder for status sync
    return 'OK'

if __name__ == '__main__':
    os.makedirs(os.path.dirname(STREAM_FILE), exist_ok=True)
    maybe_ensure_background_bridge(force=True)
    mode = "raw (no suppression)" if RAW_TRANSCRIPT_MODE else "normalized"
    print(f"📝 Transcript mode: {mode}")
    if KWS_INGEST_URL:
        print(f"🔌 KWS forward enabled: stream_id={KWS_STREAM_ID}")
        print(f"   ingest={KWS_INGEST_URL} (timeout={KWS_INGEST_TIMEOUT_SECONDS:.1f}s)")
        if KWS_FLUSH_URL:
            print(
                f"   flush={KWS_FLUSH_URL} every {KWS_FLUSH_INTERVAL_SECONDS:.1f}s "
                f"(timeout={KWS_FLUSH_TIMEOUT_SECONDS:.1f}s)"
            )
    app.run(host='127.0.0.1', port=50005)

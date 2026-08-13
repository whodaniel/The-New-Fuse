interface Env {
  KWS_API_ORIGIN: string;
  EDGE_API_KEY: string;
  ENVIRONMENT: string;
}

const voiceTestHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TNF Voice Test</title>
  <style>
    body { font-family: ui-sans-serif, -apple-system, Segoe UI, Roboto, sans-serif; margin: 24px; color: #111; }
    .row { margin-bottom: 12px; }
    label { display: block; font-weight: 600; margin-bottom: 6px; }
    input, textarea, button { font: inherit; }
    input, textarea { width: 100%; max-width: 920px; padding: 8px; }
    textarea { min-height: 90px; }
    button { margin-right: 8px; padding: 8px 12px; cursor: pointer; }
    pre { background: #f5f5f5; padding: 12px; overflow: auto; max-width: 920px; }
    .muted { color: #555; font-size: 14px; }
  </style>
</head>
<body>
  <h1>TNF Voice Test</h1>
  <p class="muted">Speak, transcribe, send to pipeline, then view rule and LLM results.</p>

  <div class="row">
    <label for="apiKey">Edge API Key</label>
    <input id="apiKey" type="password" placeholder="Paste x-edge-api-key" />
  </div>

  <div class="row">
    <label for="transcript">Transcript</label>
    <textarea id="transcript" placeholder="Your speech transcript appears here"></textarea>
  </div>

  <div class="row">
    <button id="listenBtn">Start Listening</button>
    <button id="stopBtn">Stop</button>
    <button id="sendBtn">Send To Pipeline</button>
    <button id="voiceBtn">Voice Transcript</button>
    <button id="voiceStopBtn">Stop Voice</button>
    <span id="status" class="muted">idle</span>
  </div>

  <div class="row">
    <label>Current Stream ID</label>
    <pre id="sid">(none)</pre>
  </div>

  <div class="row">
    <label>Output</label>
    <pre id="output">{}</pre>
  </div>

  <script>
    const transcriptEl = document.getElementById("transcript");
    const apiKeyEl = document.getElementById("apiKey");
    const outputEl = document.getElementById("output");
    const statusEl = document.getElementById("status");
    const sidEl = document.getElementById("sid");
    const listenBtn = document.getElementById("listenBtn");
    const stopBtn = document.getElementById("stopBtn");
    const sendBtn = document.getElementById("sendBtn");
    const voiceBtn = document.getElementById("voiceBtn");
    const voiceStopBtn = document.getElementById("voiceStopBtn");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let finalChunks = [];
    let lastFinalChunk = "";
    let speaking = false;

    const setStatus = (text) => { statusEl.textContent = text; };
    const print = (value) => { outputEl.textContent = JSON.stringify(value, null, 2); };
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const normalizeTranscript = (input) =>
      input.replace(/\\s+/g, " ").trim();

    const renderTranscript = (interimText = "") => {
      const composed = [...finalChunks, interimText].join(" ");
      transcriptEl.value = normalizeTranscript(composed);
    };

    if (!SpeechRecognition) {
      setStatus("SpeechRecognition API unavailable. Use Chrome/Edge.");
      listenBtn.disabled = true;
      stopBtn.disabled = true;
    }

    listenBtn.addEventListener("click", () => {
      if (!SpeechRecognition) return;
      if (recognition) {
        try {
          recognition.stop();
        } catch (error) {
          // ignore stale recognizer stop errors
        }
      }
      finalChunks = [];
      lastFinalChunk = "";
      renderTranscript();
      recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setStatus("listening...");
      recognition.onerror = (event) => setStatus("error: " + event.error);
      recognition.onend = () => setStatus("idle");
      recognition.onresult = (event) => {
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const chunk = normalizeTranscript(event.results[i][0].transcript || "");
          if (!chunk) continue;
          if (event.results[i].isFinal) {
            if (chunk !== lastFinalChunk) {
              finalChunks.push(chunk);
              lastFinalChunk = chunk;
            }
            continue;
          }
          interimText += chunk + " ";
        }
        renderTranscript(interimText);
      };
      recognition.start();
    });

    stopBtn.addEventListener("click", () => {
      if (recognition) {
        recognition.stop();
      }
    });

    voiceBtn.addEventListener("click", () => {
      const text = normalizeTranscript(transcriptEl.value);
      if (!text) {
        alert("Transcript is empty.");
        return;
      }
      if (!("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance !== "function") {
        alert("Speech synthesis is not supported in this browser.");
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      speaking = true;
      setStatus("speaking...");
      utterance.onend = () => {
        speaking = false;
        setStatus("idle");
      };
      utterance.onerror = () => {
        speaking = false;
        setStatus("voice error");
      };
      window.speechSynthesis.speak(utterance);
    });

    voiceStopBtn.addEventListener("click", () => {
      if (!("speechSynthesis" in window)) return;
      if (!speaking && !window.speechSynthesis.speaking) return;
      window.speechSynthesis.cancel();
      speaking = false;
      setStatus("idle");
    });

    sendBtn.addEventListener("click", async () => {
      const key = apiKeyEl.value.trim();
      const utterance = transcriptEl.value.trim();
      if (!key) {
        alert("Paste Edge API key first.");
        return;
      }
      if (!utterance) {
        alert("Transcript is empty.");
        return;
      }

      const streamId = "voice_" + Date.now();
      sidEl.textContent = streamId;
      setStatus("sending...");

      const headers = {
        "content-type": "application/json",
        "x-edge-api-key": key
      };

      try {
        const ingest = await fetch("/v1/ingest/text", {
          method: "POST",
          headers,
          body: JSON.stringify({ streamId, utterance })
        });
        const ingestJson = await ingest.json();
        if (!ingest.ok) {
          print({ ingest: ingestJson });
          setStatus("ingest failed");
          return;
        }

        await sleep(2500);
        const flush = await fetch("/v1/flush", { method: "POST", headers });
        const flushJson = await flush.json();

        await sleep(7000);
        const rulesRes = await fetch("/v1/events/rules?limit=20", { headers });
        const rulesJson = await rulesRes.json();
        const llmRes = await fetch("/v1/events/llm-results?limit=20", { headers });
        const llmJson = await llmRes.json();

        const filteredRules = (rulesJson.items || []).filter((x) => x.streamId === streamId);
        const filteredLlm = (llmJson.items || []).filter((x) => x.streamId === streamId);
        print({
          streamId,
          ingest: ingestJson,
          flush: flushJson,
          rules: filteredRules,
          llm: filteredLlm
        });
        setStatus("done");
      } catch (error) {
        print({ error: String(error) });
        setStatus("request error");
      }
    });
  </script>
</body>
</html>`;

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });

const isAuthorized = (request: Request, env: Env): boolean => {
  const token = request.headers.get('x-edge-api-key');
  return Boolean(token) && token === env.EDGE_API_KEY;
};

const copyHeaders = (request: Request): Headers => {
  const headers = new Headers(request.headers);
  headers.delete('host');
  return headers;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const incomingUrl = new URL(request.url);

    if (request.method === 'GET' && incomingUrl.pathname === '/voice-test') {
      return new Response(voiceTestHtml, {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
        },
      });
    }

    if (incomingUrl.pathname === '/healthz') {
      return json({
        status: 'ok',
        edge: 'cloudflare-worker',
        environment: env.ENVIRONMENT,
      });
    }

    if (!isAuthorized(request, env)) {
      return json({ error: 'unauthorized' }, 401);
    }

    const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, env.KWS_API_ORIGIN);
    const upstreamRequest = new Request(upstreamUrl.toString(), {
      method: request.method,
      headers: copyHeaders(request),
      body: request.body,
      redirect: 'follow',
    });

    return fetch(upstreamRequest, {
      cf: {
        cacheTtl: 0,
        cacheEverything: false,
      },
    });
  },
};

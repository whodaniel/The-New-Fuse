let PIPER_SESSION = null;
async function main(event): any {
    var _a;
    if (event.data.type === "voices") {
        const stored = await TTS.stored();
        const voices = await TTS.voices();
        voices.forEach((voice) => (voice.is_stored = stored.includes(voice.key)));
        self.postMessage({ type: "voices", voices });
        return;
    }
    if (event.data.type === "flush") {
        await TTS.flush();
        self.postMessage({ type: "flush", flushed: true });
        return;
    }
    if (((_a = event.data) === null || _a === void 0 ? void 0 : _a.type) !== "init")
        return;
    if (!PIPER_SESSION) {
        PIPER_SESSION = new TTS.TtsSession(Object.assign({ voiceId: event.data.voiceId, progress: (e) => self.postMessage(JSON.stringify(e)), logger: (msg) => self.postMessage(msg) }, (!!event.data.baseUrl
            ? {
                wasmPaths: {
                    onnxWasm: `${event.data.baseUrl}/piper/ort/`,
                    piperData: `${event.data.baseUrl}/piper/piper_phonemize.data`,
                    piperWasm: `${event.data.baseUrl}/piper/piper_phonemize.wasm`,
                },
            }
            : {})));
    }
    if (event.data.voiceId && PIPER_SESSION.voiceId !== event.data.voiceId)
        PIPER_SESSION.voiceId = event.data.voiceId;
    PIPER_SESSION.predict(event.data.text)
        .then((res) => {
        if (res instanceof Blob) {
            self.postMessage({ type: "result", audio: res });
            return;
        }
    })
        .catch((error) => {
        self.postMessage({ type: "error", message: error.message, error });
    });
}
self.addEventListener("message", main);
//# sourceMappingURL=worker.js.map
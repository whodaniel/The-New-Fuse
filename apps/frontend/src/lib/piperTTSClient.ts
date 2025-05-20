    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _PiperTTSClient_instances, _PiperTTSClient_getWorker;
import showToast from '../toast.js';
class PiperTTSClient {
    constructor({ voiceId } = { voiceId: null }) {
        _PiperTTSClient_instances.add(this);
        this.voiceId = "en_US-hfc_female-medium";
        this.worker = null;
        if (PiperTTSClient._instance) {
            this.voiceId = voiceId !== null ? voiceId : this.voiceId;
            return PiperTTSClient._instance;
        }
        this.voiceId = voiceId !== null ? voiceId : this.voiceId;
        PiperTTSClient._instance = this;
        return this;
    }
    static async voices() {
        const tmpWorker = new Worker(new URL("./worker.js", import.meta.url), {
            type: "module",
        });
        tmpWorker.postMessage({ type: "voices" });
        return new Promise((resolve, reject) => {
            let timeout = null;
            const handleMessage = (event): any => {
                if (event.data.type !== "voices") {
                    
                    return;
                }
                resolve(event.data.voices);
                tmpWorker.removeEventListener("message", handleMessage);
                timeout && clearTimeout(timeout);
                tmpWorker.terminate();
            };
            timeout = setTimeout(() => {
                reject("TTS Worker timed out.");
            }, 30000);
            tmpWorker.addEventListener("message", handleMessage);
        });
    }
    static async flush() {
        const tmpWorker = new Worker(new URL("./worker.js", import.meta.url), {
            type: "module",
        });
        tmpWorker.postMessage({ type: "flush" });
        return new Promise((resolve, reject) => {
            let timeout = null;
            const handleMessage = (event): any => {
                if (event.data.type !== "flush") {
                    
                    return;
                }
                resolve(event.data.flushed);
                tmpWorker.removeEventListener("message", handleMessage);
                timeout && clearTimeout(timeout);
                tmpWorker.terminate();
            };
            timeout = setTimeout(() => {
                reject("TTS Worker timed out.");
            }, 30000);
            tmpWorker.addEventListener("message", handleMessage);
        });
    }
    async waitForBlobResponse() {
        return new Promise((resolve) => {
            let timeout = null;
            const handleMessage = (event): any => {
                if (event.data.type === "error") {
                    this.worker.removeEventListener("message", handleMessage);
                    timeout && clearTimeout(timeout);
                    return resolve({ blobURL: null, error: event.data.message });
                }
                if (event.data.type !== "result") {
                    
                    return;
                }
                resolve({
                    blobURL: URL.createObjectURL(event.data.audio),
                    error: null,
                });
                this.worker.removeEventListener("message", handleMessage);
                timeout && clearTimeout(timeout);
            };
            timeout = setTimeout(() => {
                resolve({ blobURL: null, error: "PiperTTSWorker Worker timed out." });
            }, 30000);
            this.worker.addEventListener("message", handleMessage);
        });
    }
    async getAudioBlobForText(textToSpeak, voiceId = null) {
        const primaryWorker = __classPrivateFieldGet(this, _PiperTTSClient_instances, "m", _PiperTTSClient_getWorker).call(this);
        primaryWorker.postMessage({
            type: "init",
            text: String(textToSpeak),
            voiceId: voiceId !== null && voiceId !== void 0 ? voiceId : this.voiceId,
        });
        const { blobURL, error } = await this.waitForBlobResponse();
        if (!!error) {
            showToast(`Could not generate voice prediction. Error: ${error}`, "error", { clear: true });
            return;
        }
        return blobURL;
    }
}
_PiperTTSClient_instances = new WeakSet(), _PiperTTSClient_getWorker = function _PiperTTSClient_getWorker(): any {
    if (!this.worker)
        this.worker = new Worker(new URL("./worker.js", import.meta.url), {
            type: "module",
        });
    return this.worker;
};
export default PiperTTSClient;
//# sourceMappingURL=piperTTSClient.js.map
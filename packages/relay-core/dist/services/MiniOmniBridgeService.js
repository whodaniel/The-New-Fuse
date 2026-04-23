"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniOmniBridgeService = void 0;
const promises_1 = require("fs/promises");
const path = __importStar(require("path"));
const DEFAULT_MINI_OMNI_API_URL = process.env.MINI_OMNI_API_URL || 'http://127.0.0.1:60808/chat';
/**
 * Deterministic HTTP bridge for Mini-Omni so TNF orchestrators and scripts
 * can invoke local speech-to-speech inference without coupling to CLI internals.
 */
class MiniOmniBridgeService {
    constructor(logger, defaultApiUrl = DEFAULT_MINI_OMNI_API_URL) {
        this.logger = logger;
        this.defaultApiUrl = defaultApiUrl;
    }
    async run(request) {
        const startedAt = Date.now();
        const apiUrl = request.apiUrl || this.defaultApiUrl;
        const streamStride = request.streamStride ?? 8;
        const maxTokens = request.maxTokens ?? 256;
        const timeoutMs = request.timeoutMs ?? 120_000;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const audioBuffer = await (0, promises_1.readFile)(request.audioPath);
            const payload = {
                audio: audioBuffer.toString('base64'),
                stream_stride: streamStride,
                max_tokens: maxTokens,
            };
            this.logger.info(`Mini-Omni bridge request started (apiUrl=${apiUrl}, streamStride=${streamStride}, maxTokens=${maxTokens})`);
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    ...(request.headers || {}),
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
            const chunkBuffers = [];
            let bytes = 0;
            let chunks = 0;
            if (response.body) {
                const reader = response.body.getReader();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    if (!value)
                        continue;
                    const chunk = Buffer.from(value);
                    chunkBuffers.push(chunk);
                    chunks += 1;
                    bytes += chunk.length;
                }
            }
            const contentType = response.headers.get('content-type');
            const durationMs = Date.now() - startedAt;
            const combined = Buffer.concat(chunkBuffers);
            if (!response.ok) {
                const errorPreview = combined.toString('utf8').slice(0, 4000);
                const result = {
                    ok: false,
                    statusCode: response.status,
                    statusText: response.statusText,
                    contentType,
                    bytes,
                    chunks,
                    durationMs,
                    error: errorPreview || `HTTP ${response.status}`,
                    request: {
                        apiUrl,
                        streamStride,
                        maxTokens,
                        timeoutMs,
                        audioPath: request.audioPath,
                    },
                };
                this.logger.warn(`Mini-Omni bridge request failed (status=${response.status}, bytes=${bytes}, chunks=${chunks})`);
                return result;
            }
            if (request.outputPath) {
                await (0, promises_1.mkdir)(path.dirname(request.outputPath), { recursive: true });
                await (0, promises_1.writeFile)(request.outputPath, combined);
            }
            const result = {
                ok: true,
                statusCode: response.status,
                statusText: response.statusText,
                contentType,
                bytes,
                chunks,
                durationMs,
                outputPath: request.outputPath,
                request: {
                    apiUrl,
                    streamStride,
                    maxTokens,
                    timeoutMs,
                    audioPath: request.audioPath,
                },
            };
            this.logger.info(`Mini-Omni bridge request completed (status=${response.status}, bytes=${bytes}, chunks=${chunks}, durationMs=${durationMs})`);
            return result;
        }
        catch (error) {
            const durationMs = Date.now() - startedAt;
            const message = error instanceof Error ? error.message : String(error);
            const aborted = message.toLowerCase().includes('abort');
            const result = {
                ok: false,
                statusCode: null,
                statusText: null,
                contentType: null,
                bytes: 0,
                chunks: 0,
                durationMs,
                error: aborted ? `timeout after ${timeoutMs}ms` : message,
                request: {
                    apiUrl,
                    streamStride,
                    maxTokens,
                    timeoutMs,
                    audioPath: request.audioPath,
                },
            };
            this.logger.error(`Mini-Omni bridge request error: ${result.error}`);
            return result;
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
exports.MiniOmniBridgeService = MiniOmniBridgeService;
//# sourceMappingURL=MiniOmniBridgeService.js.map
import { Logger } from '../utils/Logger.js';
export interface MiniOmniRunRequest {
    audioPath: string;
    apiUrl?: string;
    streamStride?: number;
    maxTokens?: number;
    timeoutMs?: number;
    outputPath?: string;
    headers?: Record<string, string>;
}
export interface MiniOmniRunResult {
    ok: boolean;
    statusCode: number | null;
    statusText: string | null;
    contentType: string | null;
    bytes: number;
    chunks: number;
    durationMs: number;
    outputPath?: string;
    error?: string;
    request: {
        apiUrl: string;
        streamStride: number;
        maxTokens: number;
        timeoutMs: number;
        audioPath: string;
    };
}
/**
 * Deterministic HTTP bridge for Mini-Omni so TNF orchestrators and scripts
 * can invoke local speech-to-speech inference without coupling to CLI internals.
 */
export declare class MiniOmniBridgeService {
    private readonly logger;
    private readonly defaultApiUrl;
    constructor(logger: Logger, defaultApiUrl?: string);
    run(request: MiniOmniRunRequest): Promise<MiniOmniRunResult>;
}
//# sourceMappingURL=MiniOmniBridgeService.d.ts.map
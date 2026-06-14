import { Logger } from '../utils/Logger.js';
export interface PiRunRequest {
    prompt: string;
    cwd?: string;
    provider?: string;
    model?: string;
    sessionKey?: string;
    continueSession?: boolean;
    skillPaths?: string[];
    extraArgs?: string[];
    timeoutMs?: number;
    env?: Record<string, string>;
}
export interface PiProviderFailure {
    category: 'rate_limit' | 'auth' | 'timeout' | 'availability' | 'unknown';
    message: string;
    provider?: string;
    model?: string;
}
export interface PiRunResult {
    ok: boolean;
    exitCode: number | null;
    stdout: string;
    stderr: string;
    durationMs: number;
    command: string[];
    sessionKey?: string;
    providerFailures: PiProviderFailure[];
}
/**
 * Deterministic execution bridge around Pi CLI so TNF orchestrators/directors
 * can call Pi as a worker without coupling to Pi's internal runtime.
 */
export declare class PiCliBridgeService {
    private readonly logger;
    private readonly binary;
    constructor(logger: Logger, binary?: string);
    run(request: PiRunRequest): Promise<PiRunResult>;
}
//# sourceMappingURL=PiCliBridgeService.d.ts.map
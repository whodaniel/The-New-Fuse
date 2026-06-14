import { Logger } from '../utils/Logger.js';
export interface GooseRunRequest {
    prompt: string;
    cwd?: string;
    extraArgs?: string[];
    timeoutMs?: number;
    env?: Record<string, string>;
}
export interface GooseRunResult {
    ok: boolean;
    exitCode: number | null;
    stdout: string;
    stderr: string;
    durationMs: number;
    command: string[];
}
/**
 * Thin execution bridge around Goose CLI so TNF orchestrators can call Goose
 * as a deterministic sub-agent without coupling to Goose internals.
 */
export declare class GooseCliBridgeService {
    private readonly logger;
    private readonly binary;
    constructor(logger: Logger, binary?: string);
    run(request: GooseRunRequest): Promise<GooseRunResult>;
}
//# sourceMappingURL=GooseCliBridgeService.d.ts.map
import { ChildProcess } from 'child_process';
export interface SecureExecutionOptions {
    timeout?: number;
    cwd?: string;
    env?: Record<string, string>;
    uid?: number;
    gid?: number;
    shell?: boolean;
    maxBuffer?: number;
    killSignal?: NodeJS.Signals;
    windowsVerbatimArguments?: boolean;
    allowedCommands?: string[];
    blockedCommands?: string[];
    sanitizeOutput?: boolean;
}
export interface ExecutionResult {
    id: string;
    command: string;
    args: string[];
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    stdout: string;
    stderr: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    timedOut: boolean;
    securityViolation?: string;
}
export interface ProcessInfo {
    id: string;
    pid?: number;
    command: string;
    args: string[];
    status: 'running' | 'completed' | 'failed' | 'timeout' | 'killed';
    startTime: Date;
    process?: ChildProcess;
}
export declare class SecureSubprocessService {
    private readonly logger;
    private activeProcesses;
    private executionHistory;
    private readonly MAX_HISTORY_SIZE;
    private readonly DANGEROUS_COMMANDS;
    private readonly ALLOWED_SAFE_COMMANDS;
    constructor();
    /**
     * Execute command with comprehensive security checks
     */
    executeSecure(command: string, args?: string[], options?: SecureExecutionOptions): Promise<ExecutionResult>;
}
//# sourceMappingURL=secure-subprocess.service.d.ts.map
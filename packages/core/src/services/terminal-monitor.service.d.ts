/**
 * Terminal Monitor Service - Real-time terminal content inspection for agentic framework
 */
export interface TerminalSession {
    pid: number;
    tty: string;
    command: string;
    state: string;
    childProcesses: number[];
    workingDirectory: string;
}
export interface TerminalContent {
    pid: number;
    timestamp: Date;
    content: string;
    command?: string;
    status: 'active' | 'idle' | 'error';
}
export declare class TerminalMonitorService {
    private readonly logger;
    private monitoredTerminals;
    /**
     * Get detailed information about a terminal process
     */
    getTerminalSession(pid: number): Promise<TerminalSession | null>;
}
//# sourceMappingURL=terminal-monitor.service.d.ts.map
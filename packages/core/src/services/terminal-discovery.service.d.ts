/**
 * Terminal Discovery Service - Comprehensive terminal search and interaction for AI agents
 */
export interface TerminalInfo {
    pid: number;
    ppid: number;
    tty: string;
    command: string;
    state: string;
    workingDirectory: string;
    childProcesses: ProcessInfo[];
    terminalType: 'vscode' | 'iterm' | 'terminal' | 'other';
    aiCliType?: 'gemini' | 'claude' | 'openai' | 'other';
    isInteractive: boolean;
    windowTitle?: string;
    tabTitle?: string;
}
export interface ProcessInfo {
    pid: number;
    command: string;
    state: string;
    isAiCli: boolean;
    cliType?: string;
}
export interface TerminalSearchCriteria {
    terminalType?: string[];
    aiCliTypes?: string[];
    workingDirectory?: string;
    hasChildProcesses?: boolean;
    isInteractive?: boolean;
    commandPattern?: string;
}
export interface TerminalFocusResult {
    success: boolean;
    pid: number;
    message: string;
    inputFieldReady: boolean;
}
export declare class TerminalDiscoveryService {
    private readonly logger;
    /**
     * Discover all terminals on the system
     */
    discoverAllTerminals(): Promise<TerminalInfo[]>;
    /**
     * Focus a terminal window and prepare for input
     */
    focusTerminal(pid: number): Promise<TerminalFocusResult>;
}
//# sourceMappingURL=terminal-discovery.service.d.ts.map
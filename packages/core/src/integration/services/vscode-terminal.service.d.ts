export interface TerminalSession {
    id: string;
    pid?: number;
    command: string;
    status: 'active' | 'completed' | 'failed' | 'timeout';
    startTime: Date;
    endTime?: Date;
    output: string;
    errorOutput: string;
}
export interface TerminalControlOptions {
    timeout?: number;
    cwd?: string;
    env?: Record<string, string>;
    shell?: string;
}
export declare class VSCodeTerminalService {
    private readonly logger;
    private activeSessions;
    private terminalPids;
    constructor();
    /**
     * Create a new VSCode terminal with focus
     */
    createTerminalWithFocus(): Promise<string>;
    catch(error: any): void;
}
//# sourceMappingURL=vscode-terminal.service.d.ts.map
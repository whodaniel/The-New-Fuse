/**
 * ClaudeCodeContextService
 * Safely captures and broadcasts Claude Code execution context to TNF Relay
 * WITHOUT interfering with external API connectivity
 */
interface ClaudeExecutionContext {
    type: 'CLAUDE_CODE_EXECUTION_CONTEXT' | 'CLAUDE_CODE_COMPLETION';
    source: string;
    target: string;
    content: {
        action: string;
        working_directory?: string;
        git_repository?: string;
        git_branch?: string;
        command_args?: string;
        exit_code?: number;
        timestamp: string;
        user: string;
        shell: string;
    };
    timestamp: string;
}
export declare class ClaudeCodeContextService {
    private readonly logger;
    private relayUrl;
    private wsClient;
    private isRelayAvailable;
    private reconnectInterval;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * Check if TNF Relay is actually running before attempting connection
     */
    private checkRelayHealth;
    /**
     * Periodically check if relay becomes available
     */
    private setupHealthCheck;
    /**
     * Connect to TNF Relay WebSocket
     */
    private connectToRelay;
    /**
     * Disconnect from relay
     */
    private disconnect;
    /**
     * Send execution context to relay (fails gracefully if relay unavailable)
     */
    sendExecutionContext(context: Partial<ClaudeExecutionContext>): Promise<void>;
    /**
     * Capture current git context
     */
    captureGitContext(): Promise<{
        repo: string;
        branch: string;
    }>;
}
export {};
//# sourceMappingURL=ClaudeCodeContextService.d.ts.map
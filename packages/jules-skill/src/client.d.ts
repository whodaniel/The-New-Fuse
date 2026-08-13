// @ts-nocheck
/**
 * Jules CLI Skill - Core Client
 * Programmatic interface to the Jules CLI
 */
import { BatchSubmissionResult, CreateSessionOptions, JulesCommandResult, JulesSession, JulesTaskTemplate, ListSessionsOptions, PullSessionOptions } from './types.js';
/**
 * Jules CLI Client
 * Provides a programmatic interface to interact with Google's Jules CLI
 */
export declare class JulesClient {
    private readonly cwd;
    constructor(options?: {
        cwd?: string;
    });
    /**
     * Execute a Jules CLI command
     */
    private execute;
    /**
     * Check if Jules CLI is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Get Jules CLI version
     */
    getVersion(): Promise<string | null>;
    /**
     * Check if user is logged in
     */
    isLoggedIn(): Promise<boolean>;
    /**
     * Create a new Jules session (submit a task)
     */
    createSession(options: CreateSessionOptions): Promise<JulesSession>;
    /**
     * Create multiple sessions in parallel
     */
    createSessions(tasks: CreateSessionOptions[]): Promise<BatchSubmissionResult>;
    /**
     * List remote sessions
     */
    listSessions(options?: ListSessionsOptions): Promise<JulesSession[]>;
    /**
     * Get a specific session by ID
     */
    getSession(sessionId: string): Promise<JulesSession | null>;
    /**
     * Pull session results
     */
    pullSession(options: PullSessionOptions): Promise<JulesCommandResult>;
    /**
     * Teleport to a session (clone + checkout + apply patch)
     */
    teleport(sessionId: string): Promise<JulesCommandResult>;
    /**
     * List available repositories
     */
    listRepositories(): Promise<string[]>;
    /**
     * Submit a task from a template
     */
    submitTemplate(template: JulesTaskTemplate, options?: {
        repository?: string;
    }): Promise<JulesSession>;
    /**
     * Build a task string from a template
     */
    private buildTaskFromTemplate;
    /**
     * Parse session ID from jules new output
     */
    private parseSessionIdFromOutput;
    /**
     * Parse session list from CLI output
     */
    private parseSessionList;
    /**
     * Parse a single session line
     */
    private parseSessionLine;
    /**
     * Parse status string to enum
     */
    private parseStatus;
}
export declare const julesClient: JulesClient;
//# sourceMappingURL=client.d.ts.map
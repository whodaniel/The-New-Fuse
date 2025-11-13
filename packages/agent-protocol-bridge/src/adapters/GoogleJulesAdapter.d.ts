/**
 * Google Jules Adapter for The New Fuse Framework
 *
 * Integrates Google's Jules asynchronous coding agent with The New Fuse
 * agent orchestration system via the Jules API (v1alpha).
 *
 * This adapter provides:
 * - Jules API session management
 * - A2A protocol message translation
 * - Source context handling (GitHub repositories)
 * - Asynchronous task execution and monitoring
 * - Activity tracking and status updates
 *
 * @see https://developers.google.com/jules/api
 * @version 1.0.0
 * @since 2025-10-04
 */
import { EventEmitter } from 'events';
/**
 * Jules API Configuration
 */
export interface GoogleJulesConfig {
    agentId: string;
    agentName: string;
    apiKey: string;
    baseUrl?: string;
    defaultSource?: {
        type: 'github';
        owner: string;
        repo: string;
    };
    sessionDefaults?: {
        autoApprove?: boolean;
        timeout?: number;
    };
    usageTier?: 'free' | 'pro' | 'ultra';
}
/**
 * Jules API Session Object
 */
interface JulesSession {
    name: string;
    state?: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
    createTime?: string;
    updateTime?: string;
    sourceContext?: {
        source: string;
    };
}
/**
 * Jules API Source Object
 */
interface JulesSource {
    name: string;
    type: 'GITHUB';
    displayName?: string;
    metadata?: Record<string, any>;
}
export declare class GoogleJulesAdapter extends EventEmitter {
    private readonly logger;
    private readonly config;
    private readonly httpClient;
    private readonly activeSessions;
    private readonly rateLimits;
    constructor(config: GoogleJulesConfig);
    /**
     * Initialize rate limits based on usage tier
     */
    private initializeRateLimits;
    /**
     * Check if rate limits allow new task
     */
    private checkRateLimits;
    /**
     * List available sources (GitHub repositories)
     */
    listSources(): Promise<JulesSource[]>;
    /**
     * Create a new Jules session
     */
    createSession(params: {
        prompt: string;
        sourceContext?: {
            owner: string;
            repo: string;
        };
        autoApprove?: boolean;
    }): Promise<JulesSession>;
    /**
     * Get session status
     */
    getSession(sessionId: string): Promise<JulesSession>;
    catch(error: any): void;
}
export {};
//# sourceMappingURL=GoogleJulesAdapter.d.ts.map
/**
 * Jules CLI Service
 *
 * Service for integrating Google's Jules AI coding agent CLI into The New Fuse Framework.
 * Provides programmatic access to Jules CLI commands for task delegation, session management,
 * and asynchronous coding operations.
 *
 * @module JulesCLIService
 * @since 2025-10-05
 */
import { EventEmitter2 } from '@nestjs/event-emitter';
export interface JulesSession {
    id: string;
    repo: string;
    prompt: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    createdAt: Date;
    completedAt?: Date;
    error?: string;
}
export interface JulesRepository {
    name: string;
    fullName: string;
    connected: boolean;
    lastUsed?: Date;
}
export interface JulesRemoteNewOptions {
    repo: string;
    session: string;
    theme?: 'dark' | 'light';
}
export interface JulesRemotePullOptions {
    sessionId: string;
    outputDir?: string;
}
export interface JulesCLIConfig {
    theme?: 'dark' | 'light';
    autoLogin?: boolean;
    defaultRepo?: string;
}
export declare class JulesCLIService {
    private readonly eventEmitter;
    private readonly logger;
    private isAuthenticated;
    private config;
    constructor(eventEmitter: EventEmitter2);
    /**
     * Initialize Jules CLI service
     */
    initialize(): Promise<void>;
    /**
     * Get Jules CLI version
     */
    getVersion(): Promise<string>;
    /**
     * Login to Jules with Google account
     */
    login(): Promise<void>;
}
//# sourceMappingURL=JulesCLIService.d.ts.map
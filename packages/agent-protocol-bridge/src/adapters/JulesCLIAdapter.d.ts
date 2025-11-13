/**
 * Jules CLI Adapter
 *
 * Protocol adapter for integrating Google Jules CLI with The New Fuse agent protocol bridge.
 * Translates between A2A protocol messages and Jules CLI commands.
 *
 * @module JulesCLIAdapter
 * @since 2025-10-05
 */
import { ProtocolType } from '../types/prisma-enums';
import { A2AMessage } from '@the-new-fuse/a2a-core';
export interface JulesCLIConfig {
    theme?: 'dark' | 'light';
    defaultRepo?: string;
    autoLogin?: boolean;
    cliPath?: string;
}
export interface JulesTaskRequest {
    repo: string;
    prompt: string;
    sessionId?: string;
    priority?: 'low' | 'normal' | 'high';
    metadata?: Record<string, any>;
}
export interface JulesTaskResponse {
    sessionId: string;
    status: 'created' | 'running' | 'completed' | 'failed';
    repo: string;
    prompt: string;
    result?: string;
    error?: string;
    createdAt: Date;
    completedAt?: Date;
    metadata?: Record<string, any>;
}
export interface JulesSessionStatus {
    id: string;
    repo: string;
    prompt: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress?: number;
    currentStep?: string;
    error?: string;
}
/**
 * Jules CLI Protocol Adapter
 * Bridges A2A protocol with Jules CLI commands
 */
export declare class JulesCLIAdapter {
    private config;
    readonly name = "JulesCLIAdapter";
    readonly version = "1.0.0";
    readonly supportedProtocols: ProtocolType[];
    constructor(config?: JulesCLIConfig);
    /**
     * Translate A2A message to Jules CLI command
     */
    translateToJules(message: A2AMessage): Promise<JulesTaskRequest>;
    /**
     * Translate collaboration request to Jules task
     */
    private translateCollaborationRequest;
}
//# sourceMappingURL=JulesCLIAdapter.d.ts.map
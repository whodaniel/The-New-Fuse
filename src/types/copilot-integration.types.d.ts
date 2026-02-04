/**
 * Copilot Integration Types
 *
 * Type definitions for GitHub Copilot VS Code integration system
 */
export interface CopilotIntegrationConfig {
    autoRegisterParticipants?: boolean;
    defaultParticipantConfig?: Partial<ChatParticipant>;
    webSocketConfig?: {
        enabled: boolean;
        port?: number;
        heartbeatInterval?: number;
    };
    loggingConfig?: {
        level: 'error' | 'warn' | 'info' | 'debug';
        enableRequestLogging?: boolean;
        enableResponseLogging?: boolean;
    };
    securityConfig?: {
        allowedOrigins?: string[];
        rateLimiting?: {
            enabled: boolean;
            maxRequests?: number;
            windowMs?: number;
        };
    };
}
export interface ChatParticipant {
    id: string;
    name: string;
    description?: string;
    fullName?: string;
    iconPath?: string;
    isSticky?: boolean;
    sampleRequest?: string;
    commands?: ChatCommand[];
    followupProvider?: FollowupProvider;
    isActive?: boolean;
    tenantId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ChatCommand {
    name: string;
    description: string;
    sampleRequest?: string;
    handler?: string;
}
export interface FollowupProvider {
    provideFollowups: boolean;
    supportedCommands?: string[];
}
export interface ChatRequest {
    participant: string;
    prompt: string;
    command?: string;
    references?: ChatReference[];
    location?: ChatLocation;
    context?: Record<string, any>;
}
export interface ChatReference {
    id?: string;
    uri?: string;
    range?: ChatRange;
}
export interface ChatLocation {
    uri: string;
    range?: ChatRange;
}
export interface ChatRange {
    start: {
        line: number;
        character: number;
    };
    end: {
        line: number;
        character: number;
    };
}
export interface ChatResponse {
    markdown?: string;
    anchor?: any;
    commandFollowups?: CommandFollowup[];
    textFollowups?: TextFollowup[];
    progress?: ChatProgress;
}
export interface CommandFollowup {
    commandId: string;
    title: string;
    tooltip?: string;
}
export interface TextFollowup {
    text: string;
    tooltip?: string;
}
export interface ChatProgress {
    location: any;
    message: string;
}
export interface AgentTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    tags?: string[];
    participantConfig: ChatParticipant;
    capabilities?: string[];
    defaultCommands?: ChatCommand[];
    customInstructions?: string;
    modelPreferences?: ModelPreferences;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ModelPreferences {
    preferredModel?: string;
    temperature?: number;
    maxTokens?: number;
}
export interface ServiceStatus {
    isInitialized: boolean;
    isHealthy: boolean;
    participantCount: number;
    activeParticipants: number;
    webSocketConnected: boolean;
    lastHeartbeat?: Date;
    uptime: number;
    version: string;
    tenantId?: string;
}
export interface IntegrationMetrics {
    requests: {
        total: number;
        successful: number;
        failed: number;
        averageResponseTime: number;
    };
    participants: {
        total: number;
        active: number;
        byCategory: Record<string, number>;
    };
    usage: {
        byParticipant: Record<string, {
            requests: number;
            lastUsed: Date;
        }>;
        byCommand: Record<string, number>;
    };
    performance: {
        averageLatency: number;
        errorRate: number;
        throughput: number;
    };
}
export interface WebSocketConnectionInfo {
    url: string;
    port: number;
    isConnected: boolean;
    supportedEvents: string[];
    tenantChannel: string;
}
export interface BatchOperationResult {
    successful: string[];
    failed: Array<{
        participantId: string;
        error: string;
    }>;
    summary: {
        total: number;
        successCount: number;
        failureCount: number;
    };
}
export interface TenantConfiguration {
    tenantId: string;
    participants: ChatParticipant[];
    templates: AgentTemplate[];
    config: CopilotIntegrationConfig;
    metadata: {
        exportedAt: Date;
        version: string;
        participantCount: number;
        templateCount: number;
    };
}
export interface CopilotIntegrationEvents {
    'copilot.service.initialized': {
        tenantId: string;
        config: CopilotIntegrationConfig;
        timestamp: Date;
    };
    'copilot.participant.created': {
        tenantId: string;
        participantId: string;
        timestamp: Date;
    };
    'copilot.participant.updated': {
        tenantId: string;
        participantId: string;
        timestamp: Date;
    };
    'copilot.participant.deleted': {
        tenantId: string;
        participantId: string;
        timestamp: Date;
    };
    'copilot.template.created': {
        tenantId: string;
        templateId: string;
        timestamp: Date;
    };
    'copilot.template.updated': {
        tenantId: string;
        templateId: string;
        timestamp: Date;
    };
    'copilot.participant.created.from.template': {
        tenantId: string;
        templateId: string;
        participantId: string;
        timestamp: Date;
    };
    'copilot.participants.batch.operation': {
        tenantId: string;
        operation: string;
        participantIds?: string[];
        timestamp: Date;
    };
    'copilot.configuration.imported': {
        tenantId: string;
        mergeMode?: string;
        timestamp: Date;
    };
    'copilot.chat.request': {
        tenantId: string;
        participantId: string;
        command?: string;
        timestamp: Date;
    };
    'copilot.chat.response': {
        tenantId: string;
        participantId: string;
        responseTime: number;
        success: boolean;
        timestamp: Date;
    };
}
//# sourceMappingURL=copilot-integration.types.d.ts.map
import React from 'react';
export interface Agent {
    id: string;
    name: string;
    description?: string;
    type: AgentType;
    role?: AgentRole;
    status: AgentStatus;
    capabilities: string[];
    protocols?: string[];
    endpoints?: {
        discovery?: string;
        messaging?: string;
        metrics?: string;
    };
    security?: {
        authentication?: 'none' | 'api_key' | 'oauth2' | 'jwt';
        encryption?: boolean;
        rateLimit?: number;
    };
    metadata?: {
        version?: string;
        lastActive?: Date;
        createdAt?: Date;
        updatedAt?: Date;
        config?: Record<string, unknown>;
        [key: string]: unknown;
    };
}
export type AgentType = 'CONVERSATIONAL' | 'IDE_EXTENSION' | 'API' | 'HUMAN' | 'AI' | 'assistant' | 'worker' | 'supervisor' | 'specialist';
export type AgentRole = 'ASSISTANT' | 'DEVELOPER' | 'REVIEWER' | 'ARCHITECT' | 'TESTER' | 'DOCUMENTER' | 'assistant' | 'developer' | 'reviewer';
export type AgentStatus = 'IDLE' | 'BUSY' | 'ERROR' | 'OFFLINE' | 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'DELETED' | 'INITIALIZING' | 'READY' | 'TERMINATED' | 'LEARNING' | 'idle' | 'busy' | 'error' | 'offline' | 'active';
export interface AgentCardProps {
    agent: Agent;
    onSelect?: (agent: Agent) => void;
    onStart?: (agent: Agent) => void;
    onStop?: (agent: Agent) => void;
    onEdit?: (agent: Agent) => void;
    onDelete?: (agent: Agent) => void;
    onViewDetails?: (agent: Agent) => void;
    onConfigureEndpoints?: (agent: Agent) => void;
    className?: string;
    compact?: boolean;
    showProtocols?: boolean;
    showEndpoints?: boolean;
    showSecurity?: boolean;
}
export declare const AgentCard: React.FC<AgentCardProps>;
//# sourceMappingURL=AgentCard.d.ts.map
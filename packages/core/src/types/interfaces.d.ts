import { ServiceStatus } from './core';
export interface BaseService {
    initialize(): Promise<void>;
    destroy(): Promise<void>;
    getStatus(): ServiceStatus;
}
export interface LogEntry {
    level: string;
    message: string;
    timestamp: string;
    context?: any;
}
export interface BaseMessage {
    id: string;
    role: string;
    content: string;
    timestamp: string;
    metadata?: any;
}
export interface Agent {
    id: string;
    name: string;
    status: string;
    capabilities: string[];
    created: string;
}
export interface AgentState {
    id: string;
    status: string;
    currentTask?: string;
    lastActivity: string;
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
}
export interface ValidationWarning {
    field: string;
    message: string;
    suggestion?: string;
}
//# sourceMappingURL=interfaces.d.ts.map
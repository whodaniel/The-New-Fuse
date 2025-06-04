/**
 * Common type definitions to replace 'any' usage across the codebase
 */
export type JsonObject = Record<string, unknown>;
export interface ServiceConfig {
    [key: string]: unknown;
}
export interface DataEntity {
    id: string;
    [key: string]: unknown;
}
export type Metadata = Record<string, unknown>;
export interface AgentConfig {
    name: string;
    description?: string;
    capabilities?: string[];
    settings?: Record<string, unknown>;
    metadata?: Metadata;
}
export interface MessageContent {
    text?: string;
    type?: string;
    data?: Record<string, unknown>;
}
export interface WorkflowStepConfig {
    name: string;
    type: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    condition?: string | Record<string, unknown>;
    settings?: Record<string, unknown>;
}
export interface TaskData {
    id: string;
    type: string;
    status: string;
    data: Record<string, unknown>;
    metadata?: Metadata;
}

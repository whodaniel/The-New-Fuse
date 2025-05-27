export interface AgentMessage {
    id: string;
    type: string;
    sender: string;
    recipient?: string;
    payload: any;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface AgentRegistration {
    id: string;
    name: string;
    capabilities: string[];
    version: string;
    metadata?: Record<string, any>;
}

export interface AgentCapability {
    name: string;
    description: string;
    version: string;
    parameters?: Record<string, any>;
}
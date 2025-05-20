export interface AgentConfig {
    apiKey: string;
    tools?: unknown[];
    memory?: unknown;
}
export interface AgentResponse {
    result: string;
    visualization: {
        nodes: unknown[];
        edges: unknown[];
    };
}

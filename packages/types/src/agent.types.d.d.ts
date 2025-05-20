import { JsonValue, DataMap } from './common-types.js';
export interface AgentConfig {
    tools?: AgentTool[];
    memory?: boolean;
    visualization?: boolean;
}
export interface AgentTool {
    name: string;
    description: string;
    execute: (input: DataMap) => Promise<JsonValue>;
}
export interface AgentResponse {
    result: unknown;
    visualization?: {
        nodes: unknown[];
        edges: unknown[];
    };
}
export interface AgentMessage {
    payload: Record<string, unknown>;
}
//# sourceMappingURL=agent.types.d.d.ts.map
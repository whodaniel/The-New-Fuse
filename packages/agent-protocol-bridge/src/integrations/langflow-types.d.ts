/**
 * LangFlow Integration Types
 *
 * Comprehensive type definitions for LangFlow integration,
 * enabling dynamic AI workflow orchestration and execution
 * within The New Fuse AI Agent framework.
 */
import { NamedEntity } from '../types/common-types';
export interface LangFlowComponent {
    id: string;
    name: string;
    type: string;
    params: Record<string, any>;
    description?: string;
}
export interface LangFlowConnection {
    source: {
        componentId: string;
        port: string;
    };
    target: {
        componentId: string;
        port: string;
    };
}
export interface LangFlowFlow extends NamedEntity {
    components: LangFlowComponent[];
    connections: LangFlowConnection[];
    entrypoint?: string;
    output?: string;
    version?: string;
}
export interface LangFlowCreateFlowRequest {
    flow: LangFlowFlow;
    agentId?: string;
}
export interface LangFlowCreateFlowResponse {
    success: boolean;
    flowId?: string;
    error?: string;
}
export interface LangFlowUpdateFlowRequest {
    flowId: string;
    flow: Partial<LangFlowFlow>;
}
export interface LangFlowUpdateFlowResponse {
    success: boolean;
    flowId?: string;
    error?: string;
}
export interface LangFlowGetFlowRequest {
    flowId: string;
}
export interface LangFlowGetFlowResponse {
    success: boolean;
    flow?: LangFlowFlow;
    error?: string;
}
export interface LangFlowDeleteFlowRequest {
    flowId: string;
}
export interface LangFlowDeleteFlowResponse {
    success: boolean;
    flowId?: string;
    error?: string;
}
export interface LangFlowExecuteFlowRequest {
    flowId: string;
    input: Record<string, any>;
    stream?: boolean;
}
export interface LangFlowExecuteFlowResponse {
    success: boolean;
    output?: Record<string, any>;
    error?: string;
}
export interface LangFlowStreamEvent {
    type: 'start' | 'data' | 'end' | 'error';
    payload?: Record<string, any>;
    componentId?: string;
}
export interface LangFlowBridgeConfig {
    instanceUrl: string;
    apiKey?: string;
    defaultFlowId?: string;
}
export interface LangFlowBridge {
    createFlow(request: LangFlowCreateFlowRequest): Promise<LangFlowCreateFlowResponse>;
    updateFlow(request: LangFlowUpdateFlowRequest): Promise<LangFlowUpdateFlowResponse>;
    getFlow(request: LangFlowGetFlowRequest): Promise<LangFlowGetFlowResponse>;
    deleteFlow(request: LangFlowDeleteFlowRequest): Promise<LangFlowDeleteFlowResponse>;
    executeFlow(request: LangFlowExecuteFlowRequest): Promise<LangFlowExecuteFlowResponse | AsyncIterable<LangFlowStreamEvent>>;
}
//# sourceMappingURL=langflow-types.d.ts.map
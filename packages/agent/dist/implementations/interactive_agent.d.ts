/**
 * Interactive Agent Implementation
 * An agent designed for interactive, conversational workflows with users
 * Supports multi-turn dialogues, context retention, and dynamic responses
 */
import { IAgent } from '../interfaces/IAgent.js';
export interface InteractiveConfig {
    agentId: string;
    name: string;
    personality?: string;
    welcomeMessage?: string;
    maxContextLength?: number;
    responseTimeout?: number;
}
export interface InteractiveMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: {
        sentiment?: 'positive' | 'neutral' | 'negative';
        intent?: string;
        entities?: string[];
    };
}
export interface InteractiveSession {
    sessionId: string;
    userId?: string;
    messages: InteractiveMessage[];
    context: Record<string, unknown>;
    startTime: Date;
    lastActivity: Date;
    status: 'active' | 'paused' | 'ended';
}
export interface InteractiveResponse {
    message: InteractiveMessage;
    suggestions?: string[];
    actions?: InteractiveAction[];
    shouldContinue: boolean;
}
export interface InteractiveAction {
    type: 'button' | 'link' | 'form' | 'confirm';
    label: string;
    value: string;
    data?: Record<string, unknown>;
}
export declare class InteractiveAgent implements IAgent {
    readonly id: string;
    readonly name: string;
    readonly type = "interactive";
    readonly capabilities: string[];
    private config;
    private memory;
    private state;
    private isInitialized;
    private sessions;
    constructor(config: InteractiveConfig);
    initialize(): Promise<void>;
    process(message: any): Promise<any>;
    learn(data: unknown): Promise<void>;
    saveToMemory(key: string, value: unknown): Promise<void>;
    retrieveFromMemory(key: string): Promise<any>;
    getState(): Promise<any>;
    setState(state: unknown): Promise<void>;
    sendMessage(message: any): Promise<void>;
    receiveMessage(message: any): Promise<void>;
    handleError(error: Error): Promise<void>;
    startSession(userId?: string): Promise<InteractiveSession>;
    chat(sessionId: string, content: string): Promise<InteractiveResponse>;
    private generateResponse;
    private analyzeSentiment;
    private detectIntent;
    private extractEntities;
    endSession(sessionId: string): Promise<InteractiveSession | null>;
    getSession(sessionId: string): Promise<InteractiveSession | null>;
    setSessionContext(sessionId: string, context: Record<string, unknown>): Promise<boolean>;
}
export default InteractiveAgent;
//# sourceMappingURL=interactive_agent.d.ts.map
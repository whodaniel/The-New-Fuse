import { Agent } from 'agents';
export declare class NewFuseChatAgent extends Agent {
    private openai;
    initialize(): Promise<void>;
    onMessage(message: string): Promise<void>;
    private handleToolCall;
    confirmToolExecution(toolCall: any): Promise<any>;
    private formatMessages;
}

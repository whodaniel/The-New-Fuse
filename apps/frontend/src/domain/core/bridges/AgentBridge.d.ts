export declare class AgentBridge {
    constructor();
    static getInstance(): any;
    setupEventListeners(): void;
    handleAgentMessage(message: any): void;
    handleAgentStatusChange(payload: any): void;
    sendMessageToAgent(agentId: any, content: any): Promise<{
        success: boolean;
        data: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: {
            code: string;
            message: string;
            details: unknown;
        };
        data?: undefined;
    }>;
    getAgentConfig(agentId: any): Promise<{
        success: boolean;
        data: any;
        error?: undefined;
    } | {
        success: boolean;
        error: {
            code: string;
            message: string;
            details: unknown;
        };
        data?: undefined;
    }>;
    updateAgentStatus(agentId: any, status: any): Promise<{
        success: boolean;
        data: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: {
            code: string;
            message: string;
            details: unknown;
        };
        data?: undefined;
    }>;
    getAgentStatus(agentId: any): any;
    subscribeToAgentMessages(agentId: any, callback: any): any;
    subscribeToAgentStatus(agentId: any, callback: any): any;
}

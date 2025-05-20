export interface MCPBrokerService {
    initialize(): Promise<void>;
    cleanup(): Promise<void>;
    registerHandler(type: string, handler: (message: any) => Promise<any>): void;
    getAllCapabilities(): Record<string, Record<string, any>>;
    getAllTools(): Record<string, Record<string, any>>;
    executeCommand(agentId: string, command: string, params: Record<string, any>, options?: {
        sender: string;
        metadata?: Record<string, any>;
    }): Promise<any>;
}
//# sourceMappingURL=services.d.ts.map
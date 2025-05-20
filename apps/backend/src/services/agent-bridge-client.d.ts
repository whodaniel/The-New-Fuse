export declare class AgentBridgeClient {
    private socket;
    private messageHandlers;
    constructor(serverUrl?: string);
    private setupEventHandlers;
    joinChannel(channel: string): Promise<void>;
    leaveChannel(channel: string): Promise<void>;
    onMessage(channel: string, handler: (message: any) => void): void;
    sendMessage(channel: string, message: any): Promise<void>;
    disconnect(): void;
}

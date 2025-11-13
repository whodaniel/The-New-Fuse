export interface Agent {
    id: string;
    onMessage: (message: any) => void;
}
export interface CommunicationProtocol {
    registerAgent(agent: Agent): void;
    unregisterAgent(agentId: string): void;
    sendMessage(agentId: string, message: any): void;
    broadcast(message: any): void;
}
export declare class WebSocketCommunicationProtocol implements CommunicationProtocol {
    private agents;
    private wss;
    constructor();
    private setup;
    registerAgent(agent: Agent): void;
    unregisterAgent(agentId: string): void;
    sendMessage(agentId: string, message: any): void;
    broadcast(message: any): void;
}
//# sourceMappingURL=WebSocketCommunicationProtocol.d.ts.map
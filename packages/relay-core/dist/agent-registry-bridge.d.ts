declare class AgentRegistryBridge {
    private ws;
    private sessionId;
    private registered;
    private messageHandlers;
    connect(): Promise<void>;
    private register;
    private handleMessage;
    on(type: string, handler: (msg: any) => void): void;
    send(type: string, payload: any): void;
    startHeartbeat(): void;
}
export { AgentRegistryBridge };
//# sourceMappingURL=agent-registry-bridge.d.ts.map
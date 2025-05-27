interface MessageTransport {
    id: string;
    name: string;
    send(message: any): Promise<void>;
    onMessage(handler: (message: any) => Promise<void>): void;
}
export declare class ProtocolRegistry {
    private transports;
    private logger;
    constructor();
    registerTransport(transport: MessageTransport): void;
    unregisterTransport(transportId: string): void;
    sendMessage(transportId: string, message: any): Promise<void>;
    broadcastMessage(message: any): Promise<void>;
}
export {};
//# sourceMappingURL=protocol-registry.d.ts.map
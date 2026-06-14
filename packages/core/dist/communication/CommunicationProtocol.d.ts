export interface MessageProtocol {
    type: string;
    payload: any;
    timestamp: Date;
    senderId: string;
    recipientId?: string;
}
export interface ProtocolHandler {
    type: string;
    handle(message: MessageProtocol): Promise<void>;
}
export declare class CommunicationProtocol {
    private handlers;
    registerHandler(handler: ProtocolHandler): void;
    processMessage(message: MessageProtocol): Promise<void>;
    createMessage(type: string, payload: any, senderId: string, recipientId?: string): MessageProtocol;
}
//# sourceMappingURL=CommunicationProtocol.d.ts.map
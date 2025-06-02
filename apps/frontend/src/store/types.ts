// Store types and transformers

export interface ApiMessage {
    id: string | number;
    sender: string;
    content: string;
    timestamp: string | Date;
    agentId: string;
}

export interface TransformedMessage {
    id: string;
    sender: string;
    content: string;
    timestamp: Date;
    agentId: string;
}

export const transformApiMessage = (message: ApiMessage): TransformedMessage => ({
    id: message.id.toString(),
    sender: message.sender,
    content: message.content,
    timestamp: new Date(message.timestamp),
    agentId: message.agentId,
});
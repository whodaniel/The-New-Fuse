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
export declare const transformApiMessage: (message: ApiMessage) => TransformedMessage;

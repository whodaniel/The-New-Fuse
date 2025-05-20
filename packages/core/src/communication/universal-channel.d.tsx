interface Participant {
    id: string;
    type: 'user' | 'ai_agent';
    capabilities: string[];
}
export declare class UniversalChannel {
    private static instance;
    private participants;
    private eventEmitter;
    private constructor();
    static getInstance(): UniversalChannel;
    private initialize;
    registerParticipant(participant: Participant): void;
    sendMessage(to: string, message: any): Promise<void>; // Updated signature
}
export {};

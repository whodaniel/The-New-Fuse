export interface AugmentMessagePayload {
    action: string;
    message: string;
    context?: Record<string, any>;
}
export interface DirectCommunicationMessage {
    type: 'direct_communication';
    source: string;
    target: string;
    timestamp: string;
    payload: AugmentMessagePayload;
    priority: 'low' | 'medium' | 'high';
}
export declare const createAugmentMessage: (target: string, action: string, message: string, context?: Record<string, any>, priority?: "low" | "medium" | "high") => DirectCommunicationMessage;
export declare const createIntroductionMessage: (target: string) => DirectCommunicationMessage;
export declare const createCollaborationRequest: (target: string, task: string) => DirectCommunicationMessage;
export declare const createStatusUpdate: (target: string, status: string) => DirectCommunicationMessage;
export declare class MessageFactory {
    static introduction: (target: string) => DirectCommunicationMessage;
    static collaborationRequest: (target: string, task: string) => DirectCommunicationMessage;
    static statusUpdate: (target: string, status: string) => DirectCommunicationMessage;
    static custom: (target: string, action: string, message: string, context?: Record<string, any>, priority?: "low" | "medium" | "high") => DirectCommunicationMessage;
}
//# sourceMappingURL=augment-message.d.ts.map
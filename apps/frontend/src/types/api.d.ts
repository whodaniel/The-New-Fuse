export declare enum AgentType {
    BASE = "base",
    ENHANCED = "enhanced",
    RESEARCH = "research",
    CASCADE = "cascade",
    WORKFLOW = "workflow",
    MARKETING = "marketing",
    TECHNICAL_SUPPORT = "technical_support",
    CUSTOMER_SUPPORT = "customer_support"
}
export declare enum ReasoningStrategy {
    DEDUCTIVE = "deductive",
    INDUCTIVE = "inductive",
    ABDUCTIVE = "abductive",
    ANALOGICAL = "analogical"
}
export interface RawApiMessage {
    id: string;
    conversationId: string;
    sender: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}
export interface RawApiConversation {
    id: string;
    userId: string;
    messages: RawApiMessage[];
    createdAt: string;
    updatedAt: string;
}
export interface TransformedMessage {
    id: string;
    conversationId: string;
    sender: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}
export interface TransformedConversation {
    id: string;
    userId: string;
    messages: TransformedMessage[];
    createdAt: string;
    updatedAt: string;
}
export declare const transformApiMessage: (apiMessage: RawApiMessage) => TransformedMessage;
export declare const transformApiConversation: (apiConversation: RawApiConversation) => TransformedConversation;

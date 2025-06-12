export enum AgentType {
    BASE = "base",
    ENHANCED = "enhanced",
    RESEARCH = "research",
    CASCADE = "cascade",
    WORKFLOW = "workflow",
    MARKETING = "marketing",
    TECHNICAL_SUPPORT = "technical_support",
    CUSTOMER_SUPPORT = "customer_support"
}

export enum ReasoningStrategy {
    DEDUCTIVE = "deductive",
    INDUCTIVE = "inductive",
    ABDUCTIVE = "abductive",
    ANALOGICAL = "analogical"
}
export const transformApiMessage = (apiMessage): any => {
    return {
        id: apiMessage.id,
        conversationId: apiMessage.conversationId,
        sender: apiMessage.sender,
        content: apiMessage.content,
        createdAt: apiMessage.createdAt,
        updatedAt: apiMessage.updatedAt,
    };
};
export const transformApiConversation = (apiConversation): any => {
    return {
        id: apiConversation.id,
        userId: apiConversation.userId,
        messages: apiConversation.messages.map(transformApiMessage),
        createdAt: apiConversation.createdAt,
        updatedAt: apiConversation.updatedAt,
    };
};
//# sourceMappingURL=api.js.map
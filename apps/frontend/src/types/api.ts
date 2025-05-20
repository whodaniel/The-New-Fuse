export var AgentType;
(function (AgentType): any {
    AgentType["BASE"] = "base";
    AgentType["ENHANCED"] = "enhanced";
    AgentType["RESEARCH"] = "research";
    AgentType["CASCADE"] = "cascade";
    AgentType["WORKFLOW"] = "workflow";
    AgentType["MARKETING"] = "marketing";
    AgentType["TECHNICAL_SUPPORT"] = "technical_support";
    AgentType["CUSTOMER_SUPPORT"] = "customer_support";
})(AgentType || (AgentType = {}));
export var ReasoningStrategy;
(function (ReasoningStrategy): any {
    ReasoningStrategy["DEDUCTIVE"] = "deductive";
    ReasoningStrategy["INDUCTIVE"] = "inductive";
    ReasoningStrategy["ABDUCTIVE"] = "abductive";
    ReasoningStrategy["ANALOGICAL"] = "analogical";
})(ReasoningStrategy || (ReasoningStrategy = {}));
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
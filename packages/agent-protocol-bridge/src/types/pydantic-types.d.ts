export interface PydanticMessage {
    model: string;
    messages: {
        role: 'user' | 'assistant';
        content: string;
    }[];
    response_model?: any;
    tools?: any[];
}
//# sourceMappingURL=pydantic-types.d.ts.map
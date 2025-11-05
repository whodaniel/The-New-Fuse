declare const _default: () => {
    llm: {
        provider: string;
        openai: {
            apiKey: string | undefined;
            model: string;
            maxTokens: number;
            temperature: number;
        };
        anthropic: {
            apiKey: string | undefined;
            model: string;
            maxTokens: number;
            temperature: number;
        };
        alibaba: {
            apiKey: string | undefined;
            model: string;
            maxTokens: number;
            temperature: number;
        };
    };
};
export default _default;
//# sourceMappingURL=llm-provider.config.d.ts.map
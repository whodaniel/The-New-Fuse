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
        'google-adk': {
            apiKey: string | undefined;
            model: string;
            baseURL: string;
            gatewayApiKey: string | undefined;
            maxTokens: number;
            temperature: number;
            timeout: number;
        };
        opencode: {
            apiKey: string | undefined;
            model: string;
            baseURL: string;
            serverPassword: string | undefined;
            maxTokens: number;
            temperature: number;
        };
        'opencode-cli': {
            cliPath: string;
            model: string;
            maxTokens: number;
            temperature: number;
        };
        minimax: {
            apiKey: string | undefined;
            model: string;
            groupId: string | undefined;
            maxTokens: number;
            temperature: number;
        };
    };
};
export default _default;
//# sourceMappingURL=llm-provider.config.d.ts.map
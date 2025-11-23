exports.BaseLLMProvider = void 0;
export class BaseLLMProvider {
    constructor(config = {}) {
        this.apiKey = config.apiKey || this.getDefaultApiKey();
        this.baseURL = config.baseURL || this.getDefaultBaseURL();
        this.model = config.model || this.getDefaultModel();
        this.maxTokens = config.maxTokens || this.getDefaultMaxTokens();
        this.defaultHeaders = config.defaultHeaders || this.getDefaultHeaders();
        this.initClient();
    }
    initClient() {
        // To be implemented by subclasses
    }
}
//# sourceMappingURL=base.js.map
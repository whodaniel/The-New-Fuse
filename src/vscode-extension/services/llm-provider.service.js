"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMProviderService = void 0;
const logging_1 = require("../core/logging");
class LLMProviderService {
    constructor(api) {
        this.api = api;
        this.logger = logging_1.Logger.getInstance();
    }
    async generateText(prompt, options) {
        try {
            const result = await this.api.generateText(prompt, options);
            return result.text;
        }
        catch (error) {
            this.logger.error(`LLM generation failed: ${error}`);
            throw error;
        }
    }
    async summarizeContent(content, level = 'default') {
        const prompt = `Summarize the following content (level: ${level}):\n\n${content}`;
        return this.generateText(prompt, { temperature: 0.3 });
    }
    async analyzeSentiment(content) {
        const prompt = `Analyze the sentiment of the following content:\n\n${content}`;
        return this.generateText(prompt, { temperature: 0.1 });
    }
}
exports.LLMProviderService = LLMProviderService;
//# sourceMappingURL=llm-provider.service.js.map
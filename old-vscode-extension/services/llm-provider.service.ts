import { getLogger,  Logger  } from '../core/logging.js';
import { LLMProvider, LLMProviderConfig } from '../types/llm.js';
import { TheFuseAPI } from '../thefuse-api.js';

export class LLMProviderService {
    private logger: Logger;

    constructor(private api: TheFuseAPI) {
        this.logger = Logger.getInstance();
    }

    async generateText(prompt: string, options?: any): Promise<string> {
        try {
            const result = await this.api.generateText(prompt, options);
            return result.text;
        } catch (error) {
            this.logger.error(`LLM generation failed: ${error}`);
            throw error;
        }
    }

    async summarizeContent(content: string, level: string = 'default'): Promise<string> {
        const prompt = `Summarize the following content (level: ${level}):\n\n${content}`;
        return this.generateText(prompt, { temperature: 0.3 });
    }

    async analyzeSentiment(content: string): Promise<string> {
        const prompt = `Analyze the sentiment of the following content:\n\n${content}`;
        return this.generateText(prompt, { temperature: 0.1 });
    }
}
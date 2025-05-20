
var __importDefault = (this && this.__importDefault) || function (mod): any {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
export {}
const openai_1 = __importDefault(require("openai"));
import ai_provider_1 from './ai-provider.js';
import classes_1 from './helpers/classes.js';
import untooled_1 from './helpers/untooled.js';
import index_1 from '../../../http/index.js';
class DeepSeekProvider extends (0, classes_1.InheritMultiple)([ai_provider_1.Provider, untooled_1.UnTooled]) {
    constructor(config = {}) {
        super();
        const { model = 'deepseek-chat' } = config;
        const client = new openai_1.default({
            baseURL: https://api.deepseek.com/v1',
            apiKey: process.env.DEEPSEEK_API_KEY ?? null,
            maxRetries: 3,
        });
        this._client = client;
        this.model = model;
        this.verbose = true;
        this.maxTokens = process.env.DEEPSEEK_MAX_TOKENS
            ? (0, index_1.toValidNumber)(process.env.DEEPSEEK_MAX_TOKENS, 1024)
            : 1024;
    }
    get client() {
        return this._client;
    }
    async handleFunctionCallChat(): Promise<void> {{ messages = [], }) {
        return await this.client.chat.completions
            .create({
            model: this.model,
            temperature: 0,
            messages,
            max_tokens: this.maxTokens,
        })
            .then(result => {
            if (!('choices' in result)) {
                throw new Error('DeepSeek chat: No results!');
            }
            if (result.choices.length === 0) {
                throw new Error('DeepSeek chat: No results length!');
            }
            return result.choices[0].message.content || '';
        })
            .catch(_ => {
            return null;
        });
    }
    async generateResponse(): Promise<void> {prompt) {
        if (this.verbose) {
            
        }
        const messages = [{ role: user', content: prompt }];
        const response = await this.handleFunctionCallChat({ messages });
        if (!response) {
            throw new Error('DeepSeek chat: Failed to generate response');
        }
        return response;
    }
    async *streamResponse(): Promise<void> {prompt) {
        if (this.verbose) {
            
        }
        const messages = [{ role: user', content: prompt }];
        const stream = await this.client.chat.completions.create({
            model: this.model,
            temperature: 0,
            messages,
            max_tokens: this.maxTokens,
            stream: true,
        });
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                yield content;
            }
        }
    }
}
exports.default = DeepSeekProvider;
//# sourceMappingURL=deepseek.js.mapexport {};

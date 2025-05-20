
var __importDefault = (this && this.__importDefault) || function (mod): any {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
export {}
const openai_1 = __importDefault(require("openai"));
import ai_provider_1 from './ai-provider.js';
import classes_1 from './helpers/classes.js';
import untooled_1 from './helpers/untooled.js';
/**
 * The agent provider for the OpenRouter provider.
 */
class ApiPieProvider extends (0, classes_1.InheritMultiple)([ai_provider_1.Provider, untooled_1.UnTooled]) {
    constructor(config = {}) {
        super();
        const { model = 'openrouter/llama-3.1-8b-instruct' } = config;
        const client = new openai_1.default({
            baseURL: https://apipie.ai/v1',
            apiKey: process.env.APIPIE_LLM_API_KEY,
            maxRetries: 3,
        });
        this._client = client;
        this.model = model;
        this.verbose = true;
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
        })
            .then(result => {
            if (!('choices' in result)) {
                throw new Error('ApiPie chat: No results!');
            }
            if (result.choices.length === 0) {
                throw new Error('ApiPie chat: No results length!');
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
            throw new Error('ApiPie chat: Failed to generate response');
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
exports.default = ApiPieProvider;
//# sourceMappingURL=apipie.js.mapexport {};

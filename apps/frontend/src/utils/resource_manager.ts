export class ResourceManager {
    constructor(config) {
        this.modelType = config.modelType;
        this.limits = config.limits || this.getDefaultLimits();
        this.usage = this.initializeUsage();
        this.logger = new Logger('ResourceManager');
    }
    getDefaultLimits() {
        return {
            max_total_tokens: 4096,
            max_input_tokens: 2048,
            max_output_tokens: 2048,
            tokens_per_dollar: 1000
        };
    }
    initializeUsage() {
        return {
            used_tokens: 0,
            remaining_tokens: this.limits.max_total_tokens,
            cost_incurred: 0,
            timestamp: new Date().toISOString()
        };
    }
    setLimits(limits) {
        this.limits = limits;
        this.usage = this.initializeUsage();
    }
    estimateCost(prompt) {
        if (!this.limits) {
            throw new Error('Resource limits not initialized');
        }
        const inputTokens = this.countTokens(prompt);
        const estimatedOutputTokens = Math.min(this.limits.max_output_tokens, Math.ceil(inputTokens * 1.5));
        const totalTokens = inputTokens + estimatedOutputTokens;
        const cost = totalTokens / this.limits.tokens_per_dollar;
        return {
            input_tokens: inputTokens,
            estimated_output_tokens: estimatedOutputTokens,
            total_tokens: totalTokens,
            estimated_cost: cost,
            model_type: this.modelType
        };
    }
    checkContextFit(text) {
        if (!this.limits) {
            throw new Error('Resource limits not initialized');
        }
        const tokens = this.countTokens(text);
        return [tokens <= this.limits.max_input_tokens, tokens];
    }
    truncateToFit(text) {
        if (!this.limits) {
            throw new Error('Resource limits not initialized');
        }
        const tokens = this.countTokens(text);
        if (tokens <= this.limits.max_input_tokens) {
            return text;
        }
        const ratio = this.limits.max_input_tokens / tokens;
        const newLength = Math.floor(text.length * ratio);
        return text.substring(0, newLength);
    }
    measureLatency(params) {
        return {
            startTime: params.startTime,
            endTime: params.endTime,
            durationMs: params.endTime - params.startTime
        };
    }
    updateUsage(tokens) {
        if (!this.limits) {
            throw new Error('Resource limits not initialized');
        }
        const cost = tokens / this.limits.tokens_per_dollar;
        this.usage = {
            used_tokens: this.usage.used_tokens + tokens,
            remaining_tokens: this.usage.remaining_tokens - tokens,
            cost_incurred: this.usage.cost_incurred + cost,
            timestamp: new Date().toISOString()
        };
        this.logger.debug(`Updated usage: ${JSON.stringify(this.usage)}`);
    }
    getUsage() {
        return Object.assign({}, this.usage);
    }
    countTokens(text) {
        return Math.ceil(text.length / 4);
    }
}
//# sourceMappingURL=resource_manager.js.map
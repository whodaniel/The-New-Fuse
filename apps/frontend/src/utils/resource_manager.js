var ResourceManager = /** @class */ (function () {
    function ResourceManager(config) {
        this.modelType = config.modelType;
        this.limits = config.limits || this.getDefaultLimits();
        this.usage = this.initializeUsage();
        this.logger = new Logger('ResourceManager');
    }
    ResourceManager.prototype.getDefaultLimits = function () {
        return {
            max_total_tokens: 4096,
            max_input_tokens: 2048,
            max_output_tokens: 2048,
            tokens_per_dollar: 1000
        };
    };
    ResourceManager.prototype.initializeUsage = function () {
        return {
            used_tokens: 0,
            remaining_tokens: this.limits.max_total_tokens,
            cost_incurred: 0,
            timestamp: new Date().toISOString()
        };
    };
    ResourceManager.prototype.setLimits = function (limits) {
        this.limits = limits;
        this.usage = this.initializeUsage();
    };
    ResourceManager.prototype.estimateCost = function (prompt) {
        if (!this.limits) {
            throw new Error('Resource limits not initialized');
        }
        var inputTokens = this.countTokens(prompt);
        var estimatedOutputTokens = Math.min(this.limits.max_output_tokens, Math.ceil(inputTokens * 1.5));
        var totalTokens = inputTokens + estimatedOutputTokens;
        var cost = totalTokens / this.limits.tokens_per_dollar;
        return {
            input_tokens: inputTokens,
            estimated_output_tokens: estimatedOutputTokens,
            total_tokens: totalTokens,
            estimated_cost: cost,
            model_type: this.modelType
        };
    };
    ResourceManager.prototype.checkContextFit = function (text) {
        if (!this.limits) {
            throw new Error('Resource limits not initialized');
        }
        var tokens = this.countTokens(text);
        return [tokens <= this.limits.max_input_tokens, tokens];
    };
    ResourceManager.prototype.truncateToFit = function (text) {
        if (!this.limits) {
            throw new Error('Resource limits not initialized');
        }
        var tokens = this.countTokens(text);
        if (tokens <= this.limits.max_input_tokens) {
            return text;
        }
        var ratio = this.limits.max_input_tokens / tokens;
        var newLength = Math.floor(text.length * ratio);
        return text.substring(0, newLength);
    };
    ResourceManager.prototype.measureLatency = function (params) {
        return {
            startTime: params.startTime,
            endTime: params.endTime,
            durationMs: params.endTime - params.startTime
        };
    };
    ResourceManager.prototype.updateUsage = function (tokens) {
        if (!this.limits) {
            throw new Error('Resource limits not initialized');
        }
        var cost = tokens / this.limits.tokens_per_dollar;
        this.usage = {
            used_tokens: this.usage.used_tokens + tokens,
            remaining_tokens: this.usage.remaining_tokens - tokens,
            cost_incurred: this.usage.cost_incurred + cost,
            timestamp: new Date().toISOString()
        };
        this.logger.debug("Updated usage: ".concat(JSON.stringify(this.usage)));
    };
    ResourceManager.prototype.getUsage = function () {
        return Object.assign({}, this.usage);
    };
    ResourceManager.prototype.countTokens = function (text) {
        return Math.ceil(text.length / 4);
    };
    return ResourceManager;
}());
export { ResourceManager };

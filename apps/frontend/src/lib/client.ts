var __await = (this && this.__await) || function (v): any { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o): any {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function (): any { return this; }, i);
    function verb(n): any { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v): any { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator): any {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function (): any { return this; }, i;
    function awaitReturn(f): any { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f): any { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v): any { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r): any { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value): any { resume("next", value); }
    function reject(value): any { resume("throw", value); }
    function settle(f, v): any { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
export {}
exports.AnthropicClient = void 0;
import sdk_1 from '@anthropic-ai/sdk';
class AnthropicClient {
    constructor(config = {}) {
        var _a;
        this.requestHistory = [];
        this.client = new sdk_1.default({
            apiKey: (_a = config.apiKey) !== null && _a !== void 0 ? _a : process.env.ANTHROPIC_API_KEY,
            baseURL: config.baseURL,
            maxRetries: config.maxRetries,
            timeout: config.timeout,
        });
        if (!this.client.apiKey) {
            throw new Error('API key must be provided either through constructor or ANTHROPIC_API_KEY environment variable');
        }
    }
    async createMessage(params) {
        var _a, _b;
        const startTime = new Date();
        try {
            const response = await this.client.messages.create(params);
            this.requestHistory.push({
                timestamp: startTime,
                model: params.model,
                inputTokens: this.estimateTokens(params.messages.map(m => m.content).join('')),
                outputTokens: this.estimateTokens(response.content[0].text),
                duration: (new Date().getTime() - startTime.getTime()) / 1000
            });
            return response;
        }
        catch (error) {
            if (error instanceof sdk_1.default.APIError) {
                if (error.status === 429) {
                    throw new Error(`Rate limit exceeded. Please wait ${(_b = (_a = error.headers) === null || _a === void 0 ? void 0 : _a['retry-after']) !== null && _b !== void 0 ? _b : '60'} seconds`);
                }
            }
            throw error;
        }
    }
    async createChatCompletion(prompt, options = {}) {
        var _a, _b, _c;
        const response = await this.createMessage(Object.assign({ model: (_a = options.model) !== null && _a !== void 0 ? _a : 'claude-3-sonnet-20240229', max_tokens: (_b = options.max_tokens) !== null && _b !== void 0 ? _b : 1024, temperature: (_c = options.temperature) !== null && _c !== void 0 ? _c : 0.7, messages: [{ role: 'user', content: prompt }] }, options));
        return response.content[0].text;
    }
    streamMessage(params) {
        return __asyncGenerator(this, arguments, function* streamMessage_1() {
            var _a, e_1, _b, _c;
            var _d, _e, _f, _g, _h;
            const stream = yield __await(this.client.messages.create(Object.assign(Object.assign({}, params), { stream: true })));
            const startTime = new Date();
            let totalContent = '';
            try {
                try {
                    for (var _j = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield __await(stream_1.next()), _a = stream_1_1.done, !_a; _j = true) {
                        _c = stream_1_1.value;
                        _j = false;
                        const chunk = _c;
                        totalContent += (_f = (_e = (_d = chunk.content) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) !== null && _f !== void 0 ? _f : '';
                        yield yield __await(chunk);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_j && !_a && (_b = stream_1.return)) yield __await(_b.call(stream_1));
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                this.requestHistory.push({
                    timestamp: startTime,
                    model: params.model,
                    inputTokens: this.estimateTokens(params.messages.map(m => m.content).join('')),
                    outputTokens: this.estimateTokens(totalContent),
                    duration: (new Date().getTime() - startTime.getTime()) / 1000
                });
            }
            catch (error) {
                if (error instanceof sdk_1.default.APIError) {
                    if (error.status === 429) {
                        throw new Error(`Rate limit exceeded. Please wait ${(_h = (_g = error.headers) === null || _g === void 0 ? void 0 : _g['retry-after']) !== null && _h !== void 0 ? _h : '60'} seconds`);
                    }
                }
                throw error;
            }
        });
    }
    getUsageStats(startTime, endTime) {
        let filteredHistory = this.requestHistory;
        if (startTime) {
            filteredHistory = filteredHistory.filter(r => r.timestamp >= startTime);
        }
        if (endTime) {
            filteredHistory = filteredHistory.filter(r => r.timestamp <= endTime);
        }
        if (filteredHistory.length === 0) {
            return {
                totalRequests: 0,
                totalInputTokens: 0,
                totalOutputTokens: 0,
                averageLatency: 0,
                requestsByModel: {}
            };
        }
        const stats = {
            totalRequests: filteredHistory.length,
            totalInputTokens: filteredHistory.reduce((sum, r) => sum + r.inputTokens, 0),
            totalOutputTokens: filteredHistory.reduce((sum, r) => sum + r.outputTokens, 0),
            averageLatency: filteredHistory.reduce((sum, r) => sum + r.duration, 0) / filteredHistory.length,
            requestsByModel: {}
        };
        filteredHistory.forEach(request => {
            if (!stats.requestsByModel[request.model]) {
                stats.requestsByModel[request.model] = 0;
            }
            stats.requestsByModel[request.model]++;
        });
        return stats;
    }
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
}
exports.AnthropicClient = AnthropicClient;
export {};
//# sourceMappingURL=client.js.map
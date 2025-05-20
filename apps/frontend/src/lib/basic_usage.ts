var __asyncValues = (this && this.__asyncValues) || function (o): any {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function (): any { return this; }, i);
    function verb(n): any { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v): any { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
export {}
import client_1 from '../src/client.js';
async function main(): any {
    var _a, e_1, _b, _c;
    var _d, _e, _f;
    const client = new client_1.AnthropicClient({
        maxRetries: 3,
        timeout: 30000,
    });
    try {
        
        const response = await client.createMessage({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1024,
            messages: [{ role: 'user', content: 'Hello Claude! How are you today?' }],
        });

        const chatResponse = await client.createChatCompletion('What is the capital of France?', { temperature: 0.7 });

        const stream = client.streamMessage({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1024,
            messages: [{ role: 'user', content: 'Tell me a short story about a robot.' }],
            stream: true,
        });
        try {
            for (var _g = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = await stream_1.next(), _a = stream_1_1.done, !_a; _g = true) {
                _c = stream_1_1.value;
                _g = false;
                const chunk = _c;
                process.stdout.write((_f = (_e = (_d = chunk.content) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) !== null && _f !== void 0 ? _f : '');
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_g && !_a && (_b = stream_1.return)) await _b.call(stream_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        
        const stats = client.getUsageStats();
        );
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
    }
}
main().catch(console.error);
export {};
//# sourceMappingURL=basic_usage.js.map
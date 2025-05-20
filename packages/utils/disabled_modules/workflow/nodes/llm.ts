
export {}
exports.createLLMNode = exports.LLMNode = void 0;
import jsx_runtime_1 from 'react/jsx-runtime';
import registry_1 from '../../providers/registry.js';
const LLMNode = ({ data }): any => {
    const providers = registry_1.providerRegistry.getAllProviders();
    const selectedProvider = providers.find(p => p.id === data.provider);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "llm-node", children: [(0, jsx_runtime_1.jsxs)("div", { className: "node-header", children: [(0, jsx_runtime_1.jsx)("h3", { children: "LLM" }), (0, jsx_runtime_1.jsx)("select", { value: data.provider, onChange: (e) => {
                            data.provider = e.target.value;
                            // Reset model when provider changes
                            data.model = registry_1.providerRegistry.getProvider(e.target.value)?.defaultModel || '';
                        }, children: providers.map(provider => ((0, jsx_runtime_1.jsx)("option", { value: provider.id, children: provider.name }, provider.id))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "node-content", children: [(0, jsx_runtime_1.jsx)("select", { value: data.model, onChange: (e) => data.model = e.target.value, children: selectedProvider?.models.map(model => ((0, jsx_runtime_1.jsx)("option", { value: model, children: model }, model))) }), (0, jsx_runtime_1.jsx)("input", { type: "number", value: data.maxTokens, onChange: (e) => data.maxTokens = parseInt(e.target.value), placeholder: "Max Tokens" }), (0, jsx_runtime_1.jsx)("input", { type: "number", value: data.temperature, onChange: (e) => data.temperature = parseFloat(e.target.value), placeholder: "Temperature", min: "0", max: "2", step: "0.1" }), (0, jsx_runtime_1.jsx)("textarea", { value: data.systemPrompt, onChange: (e) => data.systemPrompt = e.target.value, placeholder: "System Prompt" })] })] }));
};
exports.LLMNode = LLMNode;
const createLLMNode = (): any => ({
    id: `llm-${Date.now()}`,
    type: llm',
    position: { x: 0, y: 0 },
    data: {
        provider: openai',
        model: gpt-3.5-turbo',
        maxTokens: 2048,
        temperature: 0.7,
        systemPrompt: ',
    },
});
exports.createLLMNode = createLLMNode;
//# sourceMappingURL=llm.js.mapexport {};

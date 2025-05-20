"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAPINode = exports.APINode = void 0;
import jsx_runtime_1 from 'react/jsx-runtime';
import registry_1 from '../../providers/registry';
const APINode = ({ data }) => {
    const providers = registry_1.providerRegistry.getAllProviders();
    return ((0, jsx_runtime_1.jsxs)("div", { className: "api-node", children: [(0, jsx_runtime_1.jsxs)("div", { className: "node-header", children: [(0, jsx_runtime_1.jsx)("h3", { children: "API Call" }), (0, jsx_runtime_1.jsx)("select", { value: data.provider, onChange: (e) => {
                            data.provider = e.target.value;
                            // Set default endpoint based on provider
                            const provider = registry_1.providerRegistry.getProvider(e.target.value);
                            if (provider) {
                                data.endpoint = provider.baseURL;
                            }
                        }, children: providers.map(provider => ((0, jsx_runtime_1.jsxs)("option", { value: provider.id, children: [provider.name, " API"] }, provider.id))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "node-content", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", value: data.endpoint, onChange: (e) => data.endpoint = e.target.value, placeholder: "API Endpoint" }), (0, jsx_runtime_1.jsxs)("select", { value: data.method, onChange: (e) => data.method = e.target.value, children: [(0, jsx_runtime_1.jsx)("option", { value: "GET", children: "GET" }), (0, jsx_runtime_1.jsx)("option", { value: "POST", children: "POST" }), (0, jsx_runtime_1.jsx)("option", { value: "PUT", children: "PUT" }), (0, jsx_runtime_1.jsx)("option", { value: "DELETE", children: "DELETE" })] }), (0, jsx_runtime_1.jsx)("textarea", { value: JSON.stringify(data.headers, null, 2), onChange: (e) => {
                            try {
                                data.headers = JSON.parse(e.target.value);
                            }
                            catch (err) {
                                // Invalid JSON, ignore
                            }
                        }, placeholder: "Headers (JSON)" }), (0, jsx_runtime_1.jsx)("textarea", { value: data.body, onChange: (e) => data.body = e.target.value, placeholder: "Request Body" })] })] }));
};
exports.APINode = APINode;
const createAPINode = () => ({
    id: `api-${Date.now()}`,
    type: 'api',
    position: { x: 0, y: 0 },
    data: {
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: '',
    },
});
exports.createAPINode = createAPINode;
export {};
//# sourceMappingURL=api.js.map
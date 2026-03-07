"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LiteLLMOptions;
import jsx_runtime_1 from 'react/jsx-runtime';
import react_1 from 'react';
const system_1 = __importDefault(require("@/models/system"));
function LiteLLMOptions({ settings }) {
    const [basePathValue, setBasePathValue] = (0, react_1.useState)(settings?.LiteLLMBasePath);
    const [basePath, setBasePath] = (0, react_1.useState)(settings?.LiteLLMBasePath);
    const [apiKeyValue, setApiKeyValue] = (0, react_1.useState)(settings?.LiteLLMAPIKey);
    const [apiKey, setApiKey] = (0, react_1.useState)(settings?.LiteLLMAPIKey);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "w-full flex flex-col gap-y-7 mt-1.5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "w-full flex items-center gap-[36px]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Base URL" }), (0, jsx_runtime_1.jsx)("input", { type: "url", name: "LiteLLMBasePath", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "http://127.0.0.1:4000", defaultValue: settings?.LiteLLMBasePath, required: true, autoComplete: "off", spellCheck: false, onChange: (e) => setBasePathValue(e.target.value), onBlur: () => setBasePath(basePathValue) })] }), (0, jsx_runtime_1.jsx)(LiteLLMModelSelection, { settings: settings, basePath: basePath, apiKey: apiKey }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Token context window" }), (0, jsx_runtime_1.jsx)("input", { type: "number", name: "LiteLLMTokenLimit", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "4096", min: 1, onScroll: (e) => e.target.blur(), defaultValue: settings?.LiteLLMTokenLimit, required: true, autoComplete: "off" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "w-full flex items-center gap-[36px]", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex flex-col gap-y-1 mb-4", children: (0, jsx_runtime_1.jsxs)("label", { className: "text-white text-sm font-semibold flex items-center gap-x-2", children: ["API Key ", (0, jsx_runtime_1.jsx)("p", { className: "!text-xs !italic !font-thin", children: "optional" })] }) }), (0, jsx_runtime_1.jsx)("input", { type: "password", name: "LiteLLMAPIKey", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "sk-mysecretkey", defaultValue: settings?.LiteLLMAPIKey ? "*".repeat(20) : "", autoComplete: "off", spellCheck: false, onChange: (e) => setApiKeyValue(e.target.value), onBlur: () => setApiKey(apiKeyValue) })] }) })] }));
}
function LiteLLMModelSelection({ settings, basePath = null, apiKey = null }) {
    const [customModels, setCustomModels] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        async function findCustomModels() {
            if (!basePath) {
                setCustomModels([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            const { models } = await system_1.default.customModels("litellm", typeof apiKey === "boolean" ? null : apiKey, basePath);
            setCustomModels(models || []);
            setLoading(false);
        }
        findCustomModels();
    }, [basePath, apiKey]);
    if (loading || customModels.length == 0) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "LiteLLMModelPref", disabled: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: (0, jsx_runtime_1.jsx)("option", { disabled: true, selected: true, children: basePath?.includes("/v1")
                            ? "-- loading available models --"
                            : "-- waiting for URL --" }) })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "LiteLLMModelPref", required: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: customModels.length > 0 && ((0, jsx_runtime_1.jsx)("optgroup", { label: "Your loaded models", children: customModels.map((model) => {
                        return ((0, jsx_runtime_1.jsx)("option", { value: model.id, selected: settings.LiteLLMModelPref === model.id, children: model.id }, model.id));
                    }) })) })] }));
}
//# sourceMappingURL=index.js.map
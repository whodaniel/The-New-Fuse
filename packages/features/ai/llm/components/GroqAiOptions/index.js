"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GroqAiOptions;
import jsx_runtime_1 from 'react/jsx-runtime';
import react_1 from 'react';
const system_1 = __importDefault(require("@/models/system"));
function GroqAiOptions({ settings }) {
    const [inputValue, setInputValue] = (0, react_1.useState)(settings?.GroqApiKey);
    const [apiKey, setApiKey] = (0, react_1.useState)(settings?.GroqApiKey);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex gap-[36px] mt-1.5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Groq API Key" }), (0, jsx_runtime_1.jsx)("input", { type: "password", name: "GroqApiKey", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "Groq API Key", defaultValue: settings?.GroqApiKey ? "*".repeat(20) : "", required: true, autoComplete: "off", spellCheck: false, onChange: (e) => setInputValue(e.target.value), onBlur: () => setApiKey(inputValue) })] }), !settings?.credentialsOnly && ((0, jsx_runtime_1.jsx)(GroqAIModelSelection, { settings: settings, apiKey: apiKey }))] }));
}
function GroqAIModelSelection({ apiKey, settings }) {
    const [customModels, setCustomModels] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        async function findCustomModels() {
            if (!apiKey) {
                setCustomModels([]);
                setLoading(true);
                return;
            }
            try {
                setLoading(true);
                const { models } = await system_1.default.customModels("groq", apiKey);
                setCustomModels(models || []);
            }
            catch (error) {
                console.error("Failed to fetch custom models:", error);
                setCustomModels([]);
            }
            finally {
                setLoading(false);
            }
        }
        findCustomModels();
    }, [apiKey]);
    if (loading) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "GroqModelPref", disabled: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: (0, jsx_runtime_1.jsx)("option", { disabled: true, selected: true, children: "--loading available models--" }) }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs leading-[18px] font-base text-white text-opacity-60 mt-2", children: "Enter a valid API key to view all available models for your account." })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "GroqModelPref", required: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: customModels.length > 0 && ((0, jsx_runtime_1.jsx)("optgroup", { label: "Available models", children: customModels.map((model) => {
                        return ((0, jsx_runtime_1.jsx)("option", { value: model.id, selected: settings?.GroqModelPref === model.id, children: model.id }, model.id));
                    }) })) }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs leading-[18px] font-base text-white text-opacity-60 mt-2", children: "Select the GroqAI model you want to use for your conversations." })] }));
}
//# sourceMappingURL=index.js.map
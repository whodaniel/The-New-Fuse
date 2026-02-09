"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GeminiLLMOptions;
import jsx_runtime_1 from 'react/jsx-runtime';
function GeminiLLMOptions({ settings }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: "w-full flex flex-col", children: (0, jsx_runtime_1.jsxs)("div", { className: "w-full flex items-center gap-[36px] mt-1.5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Google AI API Key" }), (0, jsx_runtime_1.jsx)("input", { type: "password", name: "GeminiLLMApiKey", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "Google Gemini API Key", defaultValue: settings?.GeminiLLMApiKey ? "*".repeat(20) : "", required: true, autoComplete: "off", spellCheck: false })] }), !settings?.credentialsOnly && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsxs)("select", { name: "GeminiLLMModelPref", defaultValue: settings?.GeminiLLMModelPref || "gemini-pro", required: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: [(0, jsx_runtime_1.jsx)("optgroup", { label: "Stable Models", children: [
                                                "gemini-pro",
                                                "gemini-1.0-pro",
                                                "gemini-1.5-pro-latest",
                                                "gemini-1.5-flash-latest",
                                            ].map((model) => {
                                                return ((0, jsx_runtime_1.jsx)("option", { value: model, children: model }, model));
                                            }) }), (0, jsx_runtime_1.jsx)("optgroup", { label: "Experimental Models", children: [
                                                "gemini-1.5-pro-exp-0801",
                                                "gemini-1.5-pro-exp-0827",
                                                "gemini-1.5-flash-exp-0827",
                                                "gemini-1.5-flash-8b-exp-0827",
                                                "gemini-exp-1114",
                                                "gemini-exp-1121",
                                                "learnlm-1.5-pro-experimental",
                                            ].map((model) => {
                                                return ((0, jsx_runtime_1.jsx)("option", { value: model, children: model }, model));
                                            }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Safety Setting" }), (0, jsx_runtime_1.jsxs)("select", { name: "GeminiSafetySetting", defaultValue: settings?.GeminiSafetySetting || "BLOCK_MEDIUM_AND_ABOVE", required: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: [(0, jsx_runtime_1.jsx)("option", { value: "BLOCK_NONE", children: "None" }), (0, jsx_runtime_1.jsx)("option", { value: "BLOCK_ONLY_HIGH", children: "Block few" }), (0, jsx_runtime_1.jsx)("option", { value: "BLOCK_MEDIUM_AND_ABOVE", children: "Block some (default)" }), (0, jsx_runtime_1.jsx)("option", { value: "BLOCK_LOW_AND_ABOVE", children: "Block most" })] })] })] }))] }) }));
}
//# sourceMappingURL=index.js.map
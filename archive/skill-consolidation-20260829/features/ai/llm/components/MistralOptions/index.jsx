"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MistralOptions;
import jsx_runtime_1 from 'react/jsx-runtime';
import react_1 from 'react';
const system_1 = __importDefault(require("@/models/system"));
function MistralOptions({ settings }) {
    const [inputValue, setInputValue] = (0, react_1.useState)(settings?.MistralApiKey);
    const [mistralKey, setMistralKey] = (0, react_1.useState)(settings?.MistralApiKey);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex gap-[36px] mt-1.5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Mistral API Key" }), (0, jsx_runtime_1.jsx)("input", { type: "password", name: "MistralApiKey", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "Mistral API Key", defaultValue: settings?.MistralApiKey ? "*".repeat(20) : "", required: true, autoComplete: "off", spellCheck: false, onChange: (e) => setInputValue(e.target.value), onBlur: () => setMistralKey(inputValue) })] }), !settings?.credentialsOnly && ((0, jsx_runtime_1.jsx)(MistralModelSelection, { settings: settings, apiKey: mistralKey }))] }));
}
function MistralModelSelection({ apiKey, settings }) {
    const [customModels, setCustomModels] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        async function findCustomModels() {
            if (!apiKey) {
                setCustomModels([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            const { models } = await system_1.default.customModels("mistral", typeof apiKey === "boolean" ? null : apiKey);
            setCustomModels(models || []);
            setLoading(false);
        }
        findCustomModels();
    }, [apiKey]);
    if (loading || customModels.length == 0) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "MistralModelPref", disabled: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: (0, jsx_runtime_1.jsx)("option", { disabled: true, selected: true, children: !!apiKey
                            ? "-- loading available models --"
                            : "-- waiting for API key --" }) })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "MistralModelPref", required: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: customModels.length > 0 && ((0, jsx_runtime_1.jsx)("optgroup", { label: "Available Mistral Models", children: customModels.map((model) => {
                        return ((0, jsx_runtime_1.jsx)("option", { value: model.id, selected: settings?.MistralModelPref === model.id, children: model.id }, model.id));
                    }) })) })] }));
}
//# sourceMappingURL=index.js.map
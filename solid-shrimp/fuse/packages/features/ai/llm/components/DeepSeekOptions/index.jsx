"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DeepSeekOptions;
import jsx_runtime_1 from 'react/jsx-runtime';
import react_1 from 'react';
const system_1 = __importDefault(require("@/models/system"));
function DeepSeekOptions({ settings }) {
    const [inputValue, setInputValue] = (0, react_1.useState)(settings?.DeepSeekApiKey);
    const [deepSeekApiKey, setDeepSeekApiKey] = (0, react_1.useState)(settings?.DeepSeekApiKey);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex gap-[36px] mt-1.5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "API Key" }), (0, jsx_runtime_1.jsx)("input", { type: "password", name: "DeepSeekApiKey", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "DeepSeek API Key", defaultValue: settings?.DeepSeekApiKey ? "*".repeat(20) : "", required: true, autoComplete: "off", spellCheck: false, onChange: (e) => setInputValue(e.target.value), onBlur: () => setDeepSeekApiKey(inputValue) })] }), !settings?.credentialsOnly && ((0, jsx_runtime_1.jsx)(DeepSeekModelSelection, { settings: settings, apiKey: deepSeekApiKey }))] }));
}
function DeepSeekModelSelection({ apiKey, settings }) {
    const [models, setModels] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        async function findCustomModels() {
            if (!apiKey) {
                setModels([]);
                setLoading(true);
                return;
            }
            setLoading(true);
            const { models } = await system_1.default.customModels("deepseek", typeof apiKey === "boolean" ? null : apiKey);
            setModels(models || []);
            setLoading(false);
        }
        findCustomModels();
    }, [apiKey]);
    if (loading) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "DeepSeekModelPref", disabled: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: (0, jsx_runtime_1.jsx)("option", { disabled: true, selected: true, children: "-- loading available models --" }) })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "DeepSeekModelPref", required: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: models.map((model) => ((0, jsx_runtime_1.jsx)("option", { value: model.id, selected: settings?.DeepSeekModelPref === model.id, children: model.name }, model.id))) })] }));
}
//# sourceMappingURL=index.js.map
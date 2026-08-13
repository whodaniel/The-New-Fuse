"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NativeLLMOptions;
import jsx_runtime_1 from 'react/jsx-runtime';
import react_1 from 'react';
import react_2 from '@phosphor-icons/react';
const system_1 = __importDefault(require("@/models/system"));
function NativeLLMOptions({ settings }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "w-full flex flex-col gap-y-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex flex-col md:flex-row md:items-center gap-x-2 text-white mb-4 bg-orange-800/30 w-fit rounded-lg px-4 py-2", children: (0, jsx_runtime_1.jsxs)("div", { className: "gap-x-2 flex items-center", children: [(0, jsx_runtime_1.jsx)(react_2.Flask, { size: 18 }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm md:text-base", children: "Using a locally hosted LLM is experimental. Use with caution." })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "w-full flex items-center gap-[36px]", children: (0, jsx_runtime_1.jsx)(NativeModelSelection, { settings: settings }) })] }));
}
function NativeModelSelection({ settings }) {
    const [customModels, setCustomModels] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        async function findCustomModels() {
            setLoading(true);
            const { models } = await system_1.default.customModels("native-llm", null, null);
            setCustomModels(models || []);
            setLoading(false);
        }
        findCustomModels();
    }, []);
    if (loading || customModels.length == 0) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "NativeLLMModelPref", disabled: true, className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", children: (0, jsx_runtime_1.jsx)("option", { disabled: true, selected: true, children: "-- waiting for models --" }) })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "NativeLLMModelPref", required: true, className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", children: customModels.length > 0 && ((0, jsx_runtime_1.jsx)("optgroup", { label: "Your loaded models", children: customModels.map((model) => {
                                return ((0, jsx_runtime_1.jsx)("option", { value: model.id, selected: settings.NativeLLMModelPref === model.id, children: model.id }, model.id));
                            }) })) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Token context window" }), (0, jsx_runtime_1.jsx)("input", { type: "number", name: "NativeLLMTokenLimit", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "4096", min: 1, onScroll: (e) => e.target.blur(), defaultValue: settings?.NativeLLMTokenLimit, required: true, autoComplete: "off" })] })] }));
}
//# sourceMappingURL=index.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OpenAiOptions;
import jsx_runtime_1 from 'react/jsx-runtime';
import react_1 from 'react';
const system_1 = __importDefault(require("@/models/system"));
function OpenAiOptions({ settings }) {
    const [inputValue, setInputValue] = (0, react_1.useState)(settings?.OpenAiKey);
    const [openAIKey, setOpenAIKey] = (0, react_1.useState)(settings?.OpenAiKey);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex gap-[36px] mt-1.5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "API Key" }), (0, jsx_runtime_1.jsx)("input", { type: "password", name: "OpenAiKey", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "OpenAI API Key", defaultValue: settings?.OpenAiKey ? "*".repeat(20) : "", required: true, autoComplete: "off", spellCheck: false, onChange: (e) => setInputValue(e.target.value), onBlur: () => setOpenAIKey(inputValue) })] }), !settings?.credentialsOnly && ((0, jsx_runtime_1.jsx)(OpenAIModelSelection, { settings: settings, apiKey: openAIKey }))] }));
}
function OpenAIModelSelection({ apiKey, settings }) {
    const [groupedModels, setGroupedModels] = (0, react_1.useState)({});
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        async function findCustomModels() {
            setLoading(true);
            const { models } = await system_1.default.customModels("openai", typeof apiKey === "boolean" ? null : apiKey);
            if (models?.length > 0) {
                const modelsByOrganization = models.reduce((acc, model) => {
                    acc[model.organization] = acc[model.organization] || [];
                    acc[model.organization].push(model);
                    return acc;
                }, {});
                setGroupedModels(modelsByOrganization);
            }
            setLoading(false);
        }
        findCustomModels();
    }, [apiKey]);
    if (loading) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "OpenAiModelPref", disabled: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: (0, jsx_runtime_1.jsx)("option", { disabled: true, selected: true, children: "-- loading available models --" }) })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "OpenAiModelPref", required: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: Object.keys(groupedModels)
                    .sort()
                    .map((organization) => ((0, jsx_runtime_1.jsx)("optgroup", { label: organization, children: groupedModels[organization].map((model) => ((0, jsx_runtime_1.jsx)("option", { value: model.id, selected: settings?.OpenAiModelPref === model.id, children: model.name }, model.id))) }, organization))) })] }));
}
//# sourceMappingURL=index.js.map
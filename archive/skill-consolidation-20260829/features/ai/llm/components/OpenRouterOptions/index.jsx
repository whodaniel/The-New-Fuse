"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OpenRouterOptions;
import jsx_runtime_1 from 'react/jsx-runtime';
const system_1 = __importDefault(require("@/models/system"));
import react_1 from '@phosphor-icons/react';
import react_2 from 'react';
function OpenRouterOptions({ settings }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-y-4 mt-1.5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex gap-[36px]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "OpenRouter API Key" }), (0, jsx_runtime_1.jsx)("input", { type: "password", name: "OpenRouterApiKey", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "OpenRouter API Key", defaultValue: settings?.OpenRouterApiKey ? "*".repeat(20) : "", required: true, autoComplete: "off", spellCheck: false })] }), !settings?.credentialsOnly && ((0, jsx_runtime_1.jsx)(OpenRouterModelSelection, { settings: settings }))] }), (0, jsx_runtime_1.jsx)(AdvancedControls, { settings: settings })] }));
}
function AdvancedControls({ settings }) {
    const [showAdvancedControls, setShowAdvancedControls] = (0, react_2.useState)(false);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-y-4", children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => setShowAdvancedControls(!showAdvancedControls), className: "border-none text-white hover:text-white/70 flex items-center text-sm", children: [showAdvancedControls ? "Hide" : "Show", " advanced controls", showAdvancedControls ? ((0, jsx_runtime_1.jsx)(react_1.CaretUp, { size: 14, className: "ml-1" })) : ((0, jsx_runtime_1.jsx)(react_1.CaretDown, { size: 14, className: "ml-1" }))] }), (0, jsx_runtime_1.jsx)("div", { hidden: !showAdvancedControls, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Stream Timeout (ms)" }), (0, jsx_runtime_1.jsx)("input", { type: "number", name: "OpenRouterTimeout", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "Timeout value between token responses to auto-timeout the stream", defaultValue: settings?.OpenRouterTimeout ?? 500, autoComplete: "off", onScroll: (e) => e.target.blur(), min: 500, step: 1 })] }) })] }));
}
function OpenRouterModelSelection({ settings }) {
    const [groupedModels, setGroupedModels] = (0, react_2.useState)({});
    const [loading, setLoading] = (0, react_2.useState)(true);
    (0, react_2.useEffect)(() => {
        async function findCustomModels() {
            setLoading(true);
            const { models } = await system_1.default.customModels("openrouter");
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
    }, []);
    if (loading || Object.keys(groupedModels).length === 0) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "OpenRouterModelPref", disabled: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: (0, jsx_runtime_1.jsx)("option", { disabled: true, selected: true, children: "-- loading available models --" }) })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "OpenRouterModelPref", required: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: Object.keys(groupedModels)
                    .sort()
                    .map((organization) => ((0, jsx_runtime_1.jsx)("optgroup", { label: organization, children: groupedModels[organization].map((model) => ((0, jsx_runtime_1.jsx)("option", { value: model.id, selected: settings?.OpenRouterModelPref === model.id, children: model.name }, model.id))) }, organization))) })] }));
}
//# sourceMappingURL=index.js.map
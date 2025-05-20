"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NovitaLLMOptions;
import jsx_runtime_1 from 'react/jsx-runtime';
const system_1 = __importDefault(require("@/models/system"));
import react_1 from '@phosphor-icons/react';
import react_2 from 'react';
function NovitaLLMOptions({ settings }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "w-full flex flex-col gap-y-7", children: [(0, jsx_runtime_1.jsxs)("div", { className: "w-full flex items-start gap-[36px] mt-1.5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-theme-text-primary text-sm font-semibold block mb-3", children: "Novita API Key" }), (0, jsx_runtime_1.jsx)("input", { type: "password", name: "NovitaLLMApiKey", className: "border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "Novita API Key", defaultValue: settings?.NovitaLLMApiKey ? "*".repeat(20) : "", required: true, autoComplete: "off", spellCheck: false })] }), !settings?.credentialsOnly && ((0, jsx_runtime_1.jsx)(NovitaModelSelection, { settings: settings }))] }), (0, jsx_runtime_1.jsx)(AdvancedControls, { settings: settings })] }));
}
function AdvancedControls({ settings }) {
    const [showAdvancedControls, setShowAdvancedControls] = (0, react_2.useState)(false);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-y-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex justify-start", children: (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => setShowAdvancedControls(!showAdvancedControls), className: "border-none text-theme-text-primary hover:text-theme-text-secondary flex items-center text-sm", children: [showAdvancedControls ? "Hide" : "Show", " advanced settings", showAdvancedControls ? ((0, jsx_runtime_1.jsx)(react_1.CaretUp, { size: 14, className: "ml-1" })) : ((0, jsx_runtime_1.jsx)(react_1.CaretDown, { size: 14, className: "ml-1" }))] }) }), (0, jsx_runtime_1.jsx)("div", { hidden: !showAdvancedControls, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-theme-text-primary text-sm font-semibold block mb-3", children: "Stream Timeout (ms)" }), (0, jsx_runtime_1.jsx)("input", { type: "number", name: "NovitaLLMTimeout", className: "border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "Timeout value between token responses to auto-timeout the stream", defaultValue: settings?.NovitaLLMTimeout ?? 500, autoComplete: "off", onScroll: (e) => e.target.blur(), min: 500, step: 1 }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs leading-[18px] font-base text-theme-text-primary text-opacity-60 mt-2", children: "Timeout value between token responses to auto-timeout the stream." })] }) })] }));
}
function NovitaModelSelection({ settings }) {
    const [groupedModels, setGroupedModels] = (0, react_2.useState)({});
    const [loading, setLoading] = (0, react_2.useState)(true);
    (0, react_2.useEffect)(() => {
        async function findCustomModels() {
            setLoading(true);
            const { models } = await system_1.default.customModels("novita");
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
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-theme-text-primary text-sm font-semibold block mb-3", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "NovitaLLMModelPref", disabled: true, className: "border-none bg-theme-settings-input-bg text-theme-text-primary border-theme-border text-sm rounded-lg block w-full p-2.5", children: (0, jsx_runtime_1.jsx)("option", { disabled: true, selected: true, children: "-- loading available models --" }) })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-theme-text-primary text-sm font-semibold block mb-3", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "NovitaLLMModelPref", required: true, className: "border-none bg-theme-settings-input-bg text-theme-text-primary border-theme-border text-sm rounded-lg block w-full p-2.5", children: Object.keys(groupedModels)
                    .sort()
                    .map((organization) => ((0, jsx_runtime_1.jsx)("optgroup", { label: organization, children: groupedModels[organization].map((model) => ((0, jsx_runtime_1.jsx)("option", { value: model.id, selected: settings?.NovitaLLMModelPref === model.id, children: model.name }, model.id))) }, organization))) })] }));
}
//# sourceMappingURL=index.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ApiPieLLMOptions;
import jsx_runtime_1 from 'react/jsx-runtime';
const system_1 = __importDefault(require("@/models/system"));
import react_1 from 'react';
function ApiPieLLMOptions({ settings }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex flex-col gap-y-4 mt-1.5", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-[36px]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "APIpie API Key" }), (0, jsx_runtime_1.jsx)("input", { type: "password", name: "ApipieLLMApiKey", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "APIpie API Key", defaultValue: settings?.ApipieLLMApiKey ? "*".repeat(20) : "", required: true, autoComplete: "off", spellCheck: false })] }), !settings?.credentialsOnly && ((0, jsx_runtime_1.jsx)(APIPieModelSelection, { settings: settings }))] }) }));
}
function APIPieModelSelection({ settings }) {
    const [groupedModels, setGroupedModels] = (0, react_1.useState)({});
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        async function findCustomModels() {
            setLoading(true);
            const { models } = await system_1.default.customModels("apipie");
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
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "ApipieLLMModelPref", disabled: true, className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", children: (0, jsx_runtime_1.jsx)("option", { disabled: true, selected: true, children: "-- loading available models --" }) })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "ApipieLLMModelPref", required: true, className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", children: Object.keys(groupedModels)
                    .sort()
                    .map((organization) => ((0, jsx_runtime_1.jsx)("optgroup", { label: organization, children: groupedModels[organization].map((model) => ((0, jsx_runtime_1.jsx)("option", { value: model.id, selected: settings?.ApipieLLMModelPref === model.id, children: model.name }, model.id))) }, organization))) })] }));
}
//# sourceMappingURL=index.js.map
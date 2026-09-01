"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LMStudioOptions;
import jsx_runtime_1 from 'react/jsx-runtime';
import react_1 from 'react';
import react_2 from '@phosphor-icons/react';
const paths_1 = __importDefault(require("@/utils/paths"));
const system_1 = __importDefault(require("@/models/system"));
const Preloader_1 = __importDefault(require("@/components/Preloader"));
import constants_1 from '@/utils/constants';
const useProviderEndpointAutoDiscovery_1 = __importDefault(require("@/hooks/useProviderEndpointAutoDiscovery"));
function LMStudioOptions({ settings, showAlert = false }) {
    const { autoDetecting: loading, basePath, basePathValue, showAdvancedControls, setShowAdvancedControls, handleAutoDetectClick, } = (0, useProviderEndpointAutoDiscovery_1.default)({
        provider: "lmstudio",
        initialBasePath: settings?.LMStudioBasePath,
        ENDPOINTS: constants_1.LMSTUDIO_COMMON_URLS,
    });
    const [maxTokens, setMaxTokens] = (0, react_1.useState)(settings?.LMStudioTokenLimit || 4096);
    const handleMaxTokensChange = (e) => {
        setMaxTokens(Number(e.target.value));
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "w-full flex flex-col gap-y-7", children: [showAlert && ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col md:flex-row md:items-center gap-x-2 text-white mb-6 bg-blue-800/30 w-fit rounded-lg px-4 py-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "gap-x-2 flex items-center", children: [(0, jsx_runtime_1.jsx)(react_2.Info, { size: 12, className: "hidden md:visible" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm md:text-base", children: "LMStudio as your LLM requires you to set an embedding service to use." })] }), (0, jsx_runtime_1.jsx)("a", { href: paths_1.default.settings.embedder.modelPreference(), className: "text-sm md:text-base my-2 underline", children: "Manage embedding \u2192" })] })), (0, jsx_runtime_1.jsxs)("div", { className: "w-full flex items-start gap-[36px] mt-1.5", children: [(0, jsx_runtime_1.jsx)(LMStudioModelSelection, { settings: settings, basePath: basePath.value }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-2", children: "Max Tokens" }), (0, jsx_runtime_1.jsx)("input", { type: "number", name: "LMStudioTokenLimit", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "4096", defaultChecked: "4096", min: 1, value: maxTokens, onChange: handleMaxTokensChange, onScroll: (e) => e.target.blur(), required: true, autoComplete: "off" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs leading-[18px] font-base text-white text-opacity-60 mt-2", children: "Maximum number of tokens for context and response." })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex justify-start mt-4", children: (0, jsx_runtime_1.jsxs)("button", { onClick: (e) => {
                        e.preventDefault();
                        setShowAdvancedControls(!showAdvancedControls);
                    }, className: "border-none text-theme-text-primary hover:text-theme-text-secondary flex items-center text-sm", children: [showAdvancedControls ? "Hide" : "Show", " Manual Endpoint Input", showAdvancedControls ? ((0, jsx_runtime_1.jsx)(react_2.CaretUp, { size: 14, className: "ml-1" })) : ((0, jsx_runtime_1.jsx)(react_2.CaretDown, { size: 14, className: "ml-1" }))] }) }), (0, jsx_runtime_1.jsx)("div", { hidden: !showAdvancedControls, children: (0, jsx_runtime_1.jsx)("div", { className: "w-full flex items-start gap-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold", children: "LM Studio Base URL" }), loading ? ((0, jsx_runtime_1.jsx)(Preloader_1.default, { size: "6" })) : ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: !basePathValue.value && ((0, jsx_runtime_1.jsx)("button", { onClick: handleAutoDetectClick, className: "bg-primary-button text-xs font-medium px-2 py-1 rounded-lg hover:bg-secondary hover:text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)]", children: "Auto-Detect" })) }))] }), (0, jsx_runtime_1.jsx)("input", { type: "url", name: "LMStudioBasePath", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "http://localhost:1234/v1", value: basePathValue.value, required: true, autoComplete: "off", spellCheck: false, onChange: basePath.onChange, onBlur: basePath.onBlur }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs leading-[18px] font-base text-white text-opacity-60 mt-2", children: "Enter the URL where LM Studio is running." })] }) }) })] }));
}
function LMStudioModelSelection({ settings, basePath = null }) {
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
            try {
                const { models } = await system_1.default.customModels("lmstudio", null, basePath);
                setCustomModels(models || []);
            }
            catch (error) {
                console.error("Failed to fetch custom models:", error);
                setCustomModels([]);
            }
            setLoading(false);
        }
        findCustomModels();
    }, [basePath]);
    if (loading || customModels.length == 0) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-2", children: "LM Studio Model" }), (0, jsx_runtime_1.jsx)("select", { name: "LMStudioModelPref", disabled: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: (0, jsx_runtime_1.jsx)("option", { disabled: true, selected: true, children: !!basePath
                            ? "--loading available models--"
                            : "Enter LM Studio URL first" }) }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs leading-[18px] font-base text-white text-opacity-60 mt-2", children: "Select the LM Studio model you want to use. Models will load after entering a valid LM Studio URL." })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-2", children: "LM Studio Model" }), (0, jsx_runtime_1.jsx)("select", { name: "LMStudioModelPref", required: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: customModels.length > 0 && ((0, jsx_runtime_1.jsx)("optgroup", { label: "Your loaded models", children: customModels.map((model) => {
                        return ((0, jsx_runtime_1.jsx)("option", { value: model.id, selected: settings.LMStudioModelPref === model.id, children: model.id }, model.id));
                    }) })) }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs leading-[18px] font-base text-white text-opacity-60 mt-2", children: "Choose the LM Studio model you want to use for your conversations." })] }));
}
//# sourceMappingURL=index.js.map
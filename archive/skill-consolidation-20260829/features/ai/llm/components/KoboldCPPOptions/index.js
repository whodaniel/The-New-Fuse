"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = KoboldCPPOptions;
import jsx_runtime_1 from 'react/jsx-runtime';
import react_1 from 'react';
const system_1 = __importDefault(require("@/models/system"));
const Preloader_1 = __importDefault(require("@/components/Preloader"));
import constants_1 from '@/utils/constants';
import react_2 from '@phosphor-icons/react';
const useProviderEndpointAutoDiscovery_1 = __importDefault(require("@/hooks/useProviderEndpointAutoDiscovery"));
function KoboldCPPOptions({ settings }) {
    const { autoDetecting: loading, basePath, basePathValue, showAdvancedControls, setShowAdvancedControls, handleAutoDetectClick, } = (0, useProviderEndpointAutoDiscovery_1.default)({
        provider: "koboldcpp",
        initialBasePath: settings?.KoboldCPPBasePath,
        ENDPOINTS: constants_1.KOBOLDCPP_COMMON_URLS,
    });
    const [tokenLimit, setTokenLimit] = (0, react_1.useState)(settings?.KoboldCPPTokenLimit || 4096);
    const handleTokenLimitChange = (e) => {
        setTokenLimit(Number(e.target.value));
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "w-full flex flex-col gap-y-7", children: [(0, jsx_runtime_1.jsxs)("div", { className: "w-full flex items-start gap-[36px] mt-1.5", children: [(0, jsx_runtime_1.jsx)(KoboldCPPModelSelection, { settings: settings, basePath: basePath.value }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-2", children: "Token context window" }), (0, jsx_runtime_1.jsx)("input", { type: "number", name: "KoboldCPPTokenLimit", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "4096", min: 1, value: tokenLimit, onChange: handleTokenLimitChange, onScroll: (e) => e.target.blur(), required: true, autoComplete: "off" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs leading-[18px] font-base text-white text-opacity-60 mt-2", children: "Maximum number of tokens for context and response." })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex justify-start mt-4", children: (0, jsx_runtime_1.jsxs)("button", { onClick: (e) => {
                        e.preventDefault();
                        setShowAdvancedControls(!showAdvancedControls);
                    }, className: "border-none text-theme-text-primary hover:text-theme-text-secondary flex items-center text-sm", children: [showAdvancedControls ? "Hide" : "Show", " Manual Endpoint Input", showAdvancedControls ? ((0, jsx_runtime_1.jsx)(react_2.CaretUp, { size: 14, className: "ml-1" })) : ((0, jsx_runtime_1.jsx)(react_2.CaretDown, { size: 14, className: "ml-1" }))] }) }), (0, jsx_runtime_1.jsx)("div", { hidden: !showAdvancedControls, children: (0, jsx_runtime_1.jsx)("div", { className: "w-full flex items-start gap-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold", children: "KoboldCPP Base URL" }), loading ? ((0, jsx_runtime_1.jsx)(Preloader_1.default, { size: "6" })) : ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: !basePathValue.value && ((0, jsx_runtime_1.jsx)("button", { onClick: handleAutoDetectClick, className: "border-none bg-primary-button text-xs font-medium px-2 py-1 rounded-lg hover:bg-secondary hover:text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)]", children: "Auto-Detect" })) }))] }), (0, jsx_runtime_1.jsx)("input", { type: "url", name: "KoboldCPPBasePath", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "http://127.0.0.1:5000/v1", value: basePathValue.value, required: true, autoComplete: "off", spellCheck: false, onChange: basePath.onChange, onBlur: basePath.onBlur }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs leading-[18px] font-base text-white text-opacity-60 mt-2", children: "Enter the URL where KoboldCPP is running." })] }) }) })] }));
}
function KoboldCPPModelSelection({ settings, basePath = null }) {
    const [customModels, setCustomModels] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        async function findCustomModels() {
            if (!basePath || !basePath.includes("/v1")) {
                setCustomModels([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const { models } = await system_1.default.customModels("koboldcpp", null, basePath);
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
    if (loading || customModels.length === 0) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-2", children: "KoboldCPP Model" }), (0, jsx_runtime_1.jsx)("select", { name: "KoboldCPPModelPref", disabled: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: (0, jsx_runtime_1.jsx)("option", { disabled: true, selected: true, children: basePath?.includes("/v1")
                            ? "--loading available models--"
                            : "Enter KoboldCPP URL first" }) }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs leading-[18px] font-base text-white text-opacity-60 mt-2", children: "Select the KoboldCPP model you want to use. Models will load after entering a valid KoboldCPP URL." })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-2", children: "KoboldCPP Model" }), (0, jsx_runtime_1.jsx)("select", { name: "KoboldCPPModelPref", required: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: customModels.map((model) => ((0, jsx_runtime_1.jsx)("option", { value: model.id, selected: settings.KoboldCPPModelPref === model.id, children: model.id }, model.id))) }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs leading-[18px] font-base text-white text-opacity-60 mt-2", children: "Choose the KoboldCPP model you want to use for your conversations." })] }));
}
//# sourceMappingURL=index.js.map
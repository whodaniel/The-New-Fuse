"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LocalAiOptions;
import jsx_runtime_1 from 'react/jsx-runtime';
const react_1 = __importStar(require("react"));
import react_2 from '@phosphor-icons/react';
const paths_1 = __importDefault(require("@/utils/paths"));
const system_1 = __importDefault(require("@/models/system"));
const Preloader_1 = __importDefault(require("@/components/Preloader"));
import constants_1 from '@/utils/constants';
const useProviderEndpointAutoDiscovery_1 = __importDefault(require("@/hooks/useProviderEndpointAutoDiscovery"));
function LocalAiOptions({ settings, showAlert = false }) {
    const { autoDetecting: loading, basePath, basePathValue, showAdvancedControls, setShowAdvancedControls, handleAutoDetectClick, } = (0, useProviderEndpointAutoDiscovery_1.default)({
        provider: "localai",
        initialBasePath: settings?.LocalAiBasePath,
        ENDPOINTS: constants_1.LOCALAI_COMMON_URLS,
    });
    const [apiKeyValue, setApiKeyValue] = (0, react_1.useState)(settings?.LocalAiApiKey);
    const [apiKey, setApiKey] = (0, react_1.useState)(settings?.LocalAiApiKey);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "w-full flex flex-col gap-y-7", children: [showAlert && ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col md:flex-row md:items-center gap-x-2 text-white mb-6 bg-blue-800/30 w-fit rounded-lg px-4 py-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "gap-x-2 flex items-center", children: [(0, jsx_runtime_1.jsx)(react_2.Info, { size: 12, className: "hidden md:visible" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm md:text-base", children: "LocalAI as your LLM requires you to set an embedding service to use." })] }), (0, jsx_runtime_1.jsx)("a", { href: paths_1.default.settings.embedder.modelPreference(), className: "text-sm md:text-base my-2 underline", children: "Manage embedding \u2192" })] })), (0, jsx_runtime_1.jsxs)("div", { className: "w-full flex items-center gap-[36px] mt-1.5", children: [!settings?.credentialsOnly && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(LocalAIModelSelection, { settings: settings, basePath: basePath.value, apiKey: apiKey }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-2", children: "Token context window" }), (0, jsx_runtime_1.jsx)("input", { type: "number", name: "LocalAiTokenLimit", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "4096", min: 1, onScroll: (e) => e.target.blur(), defaultValue: settings?.LocalAiTokenLimit, required: true, autoComplete: "off" })] })] })), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex flex-col gap-y-1 mb-2", children: (0, jsx_runtime_1.jsxs)("label", { className: "text-white text-sm font-semibold flex items-center gap-x-2", children: ["Local AI API Key", " ", (0, jsx_runtime_1.jsx)("p", { className: "!text-xs !italic !font-thin", children: "optional" })] }) }), (0, jsx_runtime_1.jsx)("input", { type: "password", name: "LocalAiApiKey", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "sk-mysecretkey", defaultValue: settings?.LocalAiApiKey ? "*".repeat(20) : "", autoComplete: "off", spellCheck: false, onChange: (e) => setApiKeyValue(e.target.value), onBlur: () => setApiKey(apiKeyValue) })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex justify-start mt-4", children: (0, jsx_runtime_1.jsxs)("button", { onClick: (e) => {
                        e.preventDefault();
                        setShowAdvancedControls(!showAdvancedControls);
                    }, className: "border-none text-theme-text-primary hover:text-theme-text-secondary flex items-center text-sm", children: [showAdvancedControls ? "Hide" : "Show", " advanced settings", showAdvancedControls ? ((0, jsx_runtime_1.jsx)(react_2.CaretUp, { size: 14, className: "ml-1" })) : ((0, jsx_runtime_1.jsx)(react_2.CaretDown, { size: 14, className: "ml-1" }))] }) }), (0, jsx_runtime_1.jsx)("div", { hidden: !showAdvancedControls, children: (0, jsx_runtime_1.jsx)("div", { className: "w-full flex items-center gap-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold", children: "Local AI Base URL" }), loading ? ((0, jsx_runtime_1.jsx)(Preloader_1.default, { size: "6" })) : ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: !basePathValue.value && ((0, jsx_runtime_1.jsx)("button", { onClick: handleAutoDetectClick, className: "bg-primary-button text-xs font-medium px-2 py-1 rounded-lg hover:bg-secondary hover:text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)]", children: "Auto-Detect" })) }))] }), (0, jsx_runtime_1.jsx)("input", { type: "url", name: "LocalAiBasePath", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "http://localhost:8080/v1", value: basePathValue.value, required: true, autoComplete: "off", spellCheck: false, onChange: basePath.onChange, onBlur: basePath.onBlur })] }) }) })] }));
}
function LocalAIModelSelection({ settings, basePath = null, apiKey = null }) {
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
            const { models } = await system_1.default.customModels("localai", typeof apiKey === "boolean" ? null : apiKey, basePath);
            setCustomModels(models || []);
            setLoading(false);
        }
        findCustomModels();
    }, [basePath, apiKey]);
    if (loading || customModels.length == 0) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-2", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "LocalAiModelPref", disabled: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: (0, jsx_runtime_1.jsx)("option", { disabled: true, selected: true, children: basePath?.includes("/v1")
                            ? "-- loading available models --"
                            : "-- waiting for URL --" }) })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-2", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "LocalAiModelPref", required: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: customModels.length > 0 && ((0, jsx_runtime_1.jsx)("optgroup", { label: "Your loaded models", children: customModels.map((model) => {
                        return ((0, jsx_runtime_1.jsx)("option", { value: model.id, selected: settings.LocalAiModelPref === model.id, children: model.id }, model.id));
                    }) })) })] }));
}
//# sourceMappingURL=index.js.map
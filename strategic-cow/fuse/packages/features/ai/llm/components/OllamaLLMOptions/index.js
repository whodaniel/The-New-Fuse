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
exports.default = OllamaLLMOptions;
import jsx_runtime_1 from 'react/jsx-runtime';
const react_1 = __importStar(require("react"));
const system_1 = __importDefault(require("@/models/system"));
const Preloader_1 = __importDefault(require("@/components/Preloader"));
import constants_1 from '@/utils/constants';
import react_2 from '@phosphor-icons/react';
const useProviderEndpointAutoDiscovery_1 = __importDefault(require("@/hooks/useProviderEndpointAutoDiscovery"));
import react_tooltip_1 from 'react-tooltip';
function OllamaLLMOptions({ settings }) {
    const { autoDetecting: loading, basePath, basePathValue, showAdvancedControls, setShowAdvancedControls, handleAutoDetectClick, } = (0, useProviderEndpointAutoDiscovery_1.default)({
        provider: "ollama",
        initialBasePath: settings?.OllamaLLMBasePath,
        ENDPOINTS: constants_1.OLLAMA_COMMON_URLS,
    });
    const [performanceMode, setPerformanceMode] = (0, react_1.useState)(settings?.OllamaLLMPerformanceMode || "base");
    const [maxTokens, setMaxTokens] = (0, react_1.useState)(settings?.OllamaLLMTokenLimit || 4096);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "w-full flex flex-col gap-y-7", children: [(0, jsx_runtime_1.jsxs)("div", { className: "w-full flex items-start gap-[36px] mt-1.5", children: [(0, jsx_runtime_1.jsx)(OllamaLLMModelSelection, { settings: settings, basePath: basePath.value }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-2", children: "Max Tokens" }), (0, jsx_runtime_1.jsx)("input", { type: "number", name: "OllamaLLMTokenLimit", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "4096", defaultChecked: "4096", min: 1, value: maxTokens, onChange: (e) => setMaxTokens(Number(e.target.value)), onScroll: (e) => e.target.blur(), required: true, autoComplete: "off" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs leading-[18px] font-base text-white text-opacity-60 mt-2", children: "Maximum number of tokens for context and response." })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex justify-start mt-4", children: (0, jsx_runtime_1.jsxs)("button", { onClick: (e) => {
                        e.preventDefault();
                        setShowAdvancedControls(!showAdvancedControls);
                    }, className: "border-none text-theme-text-primary hover:text-theme-text-secondary flex items-center text-sm", children: [showAdvancedControls ? "Hide" : "Show", " advanced settings", showAdvancedControls ? ((0, jsx_runtime_1.jsx)(react_2.CaretUp, { size: 14, className: "ml-1" })) : ((0, jsx_runtime_1.jsx)(react_2.CaretDown, { size: 14, className: "ml-1" }))] }) }), (0, jsx_runtime_1.jsx)("div", { hidden: !showAdvancedControls, children: (0, jsx_runtime_1.jsxs)("div", { className: "w-full flex items-start gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold", children: "Ollama Base URL" }), loading ? ((0, jsx_runtime_1.jsx)(Preloader_1.default, { size: "6" })) : ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: !basePathValue.value && ((0, jsx_runtime_1.jsx)("button", { onClick: handleAutoDetectClick, className: "bg-primary-button text-xs font-medium px-2 py-1 rounded-lg hover:bg-secondary hover:text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)]", children: "Auto-Detect" })) }))] }), (0, jsx_runtime_1.jsx)("input", { type: "url", name: "OllamaLLMBasePath", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "http://127.0.0.1:11434", value: basePathValue.value, required: true, autoComplete: "off", spellCheck: false, onChange: basePath.onChange, onBlur: basePath.onBlur }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs leading-[18px] font-base text-white text-opacity-60 mt-2", children: "Enter the URL where Ollama is running." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-2", children: "Ollama Keep Alive" }), (0, jsx_runtime_1.jsxs)("select", { name: "OllamaLLMKeepAliveSeconds", required: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", defaultValue: settings?.OllamaLLMKeepAliveSeconds ?? "300", children: [(0, jsx_runtime_1.jsx)("option", { value: "0", children: "No cache" }), (0, jsx_runtime_1.jsx)("option", { value: "300", children: "5 minutes" }), (0, jsx_runtime_1.jsx)("option", { value: "3600", children: "1 hour" }), (0, jsx_runtime_1.jsx)("option", { value: "-1", children: "Forever" })] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs leading-[18px] font-base text-white text-opacity-60 mt-2", children: ["Choose how long Ollama should keep your model in memory before unloading.", (0, jsx_runtime_1.jsxs)("a", { className: "underline text-blue-300", href: "https://github.com/ollama/ollama/blob/main/docs/faq.md#how-do-i-keep-a-model-loaded-in-memory-or-make-it-unload-immediately", target: "_blank", rel: "noreferrer", children: [" ", "Learn more \u2192"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsxs)("label", { className: "text-white text-sm font-semibold mb-2 flex items-center", children: ["Performance Mode", (0, jsx_runtime_1.jsx)(react_2.Info, { size: 16, className: "ml-2 text-white", "data-tooltip-id": "performance-mode-tooltip" })] }), (0, jsx_runtime_1.jsxs)("select", { name: "OllamaLLMPerformanceMode", required: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", value: performanceMode, onChange: (e) => setPerformanceMode(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "base", children: "Base (Default)" }), (0, jsx_runtime_1.jsx)("option", { value: "maximum", children: "Maximum" })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs leading-[18px] font-base text-white text-opacity-60 mt-2", children: "Choose the performance mode for the Ollama model." }), (0, jsx_runtime_1.jsxs)(react_tooltip_1.Tooltip, { id: "performance-mode-tooltip", place: "bottom", className: "tooltip !text-xs max-w-xs", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-red-500", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Note:" }), " Only change this setting if you understand its implications on performance and resource usage."] }), (0, jsx_runtime_1.jsx)("br", {}), (0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Base:" }), " Ollama automatically limits the context to 2048 tokens, reducing VRAM usage. Suitable for most users."] }), (0, jsx_runtime_1.jsx)("br", {}), (0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Maximum:" }), " Uses the full context window (up to Max Tokens). May increase VRAM usage significantly."] })] })] })] }) })] }));
}
function OllamaLLMModelSelection({ settings, basePath = null }) {
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
                const { models } = await system_1.default.customModels("ollama", null, basePath);
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
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-2", children: "Ollama Model" }), (0, jsx_runtime_1.jsx)("select", { name: "OllamaLLMModelPref", disabled: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: (0, jsx_runtime_1.jsx)("option", { disabled: true, selected: true, children: !!basePath
                            ? "--loading available models--"
                            : "Enter Ollama URL first" }) }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs leading-[18px] font-base text-white text-opacity-60 mt-2", children: "Select the Ollama model you want to use. Models will load after entering a valid Ollama URL." })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-2", children: "Ollama Model" }), (0, jsx_runtime_1.jsx)("select", { name: "OllamaLLMModelPref", required: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: customModels.length > 0 && ((0, jsx_runtime_1.jsx)("optgroup", { label: "Your loaded models", children: customModels.map((model) => {
                        return ((0, jsx_runtime_1.jsx)("option", { value: model.id, selected: settings.OllamaLLMModelPref === model.id, children: model.id }, model.id));
                    }) })) }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs leading-[18px] font-base text-white text-opacity-60 mt-2", children: "Choose the Ollama model you want to use for your conversations." })] }));
}
//# sourceMappingURL=index.js.map
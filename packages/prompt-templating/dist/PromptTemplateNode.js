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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptTemplateNode = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const react_1 = __importStar(require("react"));
const reactflow_1 = require("reactflow");
const PromptTemplateNode = ({ id, data, selected }) => {
    const [isExpanded, setIsExpanded] = (0, react_1.useState)(false);
    const [isExecuting, setIsExecuting] = (0, react_1.useState)(false);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [template, setTemplate] = (0, react_1.useState)(null);
    const [templates, setTemplates] = (0, react_1.useState)([]);
    const [executionResult, setExecutionResult] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    // Load templates on mount
    react_1.default.useEffect(() => {
        const loadTemplates = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const allTemplates = await data.templateService.listTemplates(data.userId);
                setTemplates(allTemplates);
                if (data.templateId) {
                    const loadedTemplate = await data.templateService.getTemplate(data.templateId, data.userId);
                    setTemplate(loadedTemplate);
                }
            }
            catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load templates';
                setError(errorMessage);
                console.error(`Error loading templates for node ${id}:`, err);
            }
            finally {
                setIsLoading(false);
            }
        };
        loadTemplates();
    }, [data.templateService, data.templateId, id]);
    const handleTemplateSelect = (0, react_1.useCallback)(async (templateId) => {
        try {
            setError(null);
            const selectedTemplate = await data.templateService.getTemplate(templateId, data.userId);
            setTemplate(selectedTemplate);
            data.onTemplateSelect?.(templateId);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load template';
            setError(errorMessage);
            console.error(`Error selecting template for node ${id}:`, err);
        }
    }, [data, id]);
    const handleVariableChange = (0, react_1.useCallback)((key, value) => {
        const newVariables = {
            ...data.variables,
            [key]: value,
        };
        data.onVariableChange?.(newVariables);
    }, [data]);
    const handleExecute = (0, react_1.useCallback)(async () => {
        if (!data.templateId)
            return;
        setIsExecuting(true);
        setError(null);
        try {
            console.log(`Executing template for node ${id}`);
            const result = await data.templateService.executeTemplate(data.templateId, data.userId, data.versionId, data.variables);
            setExecutionResult(result);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Execution failed';
            setError(errorMessage);
            console.error(`Error executing template for node ${id}:`, err);
        }
        finally {
            setIsExecuting(false);
        }
    }, [data, id]);
    const getCurrentVersion = () => {
        if (!template)
            return null;
        return data.versionId
            ? template.versions.find((v) => v.id === data.versionId)
            : template.versions.find((v) => v.id === template.currentVersion);
    };
    const currentVersion = getCurrentVersion();
    return ((0, jsx_runtime_1.jsxs)("div", { id: `prompt-template-node-${id}`, className: `bg-white rounded-lg border-2 shadow-lg transition-all ${selected ? 'border-blue-500 shadow-blue-200' : 'border-gray-200'} ${isExpanded ? 'w-96' : 'w-64'}`, children: [(0, jsx_runtime_1.jsx)(reactflow_1.Handle, { type: "target", position: reactflow_1.Position.Top, className: "w-3 h-3 bg-purple-500", id: `${id}-input` }), (0, jsx_runtime_1.jsx)("div", { className: "p-4 border-b border-gray-200", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "p-2 bg-purple-100 rounded-md", children: (0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "w-4 h-4 text-purple-600" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-medium text-gray-900", children: "Prompt Template" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-gray-500", children: [template ? template.name : 'No template selected', " \u2022 Node: ", id] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)("button", { onClick: handleExecute, disabled: !data.templateId || isExecuting, className: "p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50", title: `Execute template (Node: ${id})`, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Play, { className: "w-4 h-4" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsExpanded(!isExpanded), className: "p-1 hover:bg-gray-100 rounded transition-colors", title: "Toggle expanded view", children: isExpanded ? (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronUp, { className: "w-4 h-4" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { className: "w-4 h-4" }) })] })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4", children: [isLoading && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 text-xs text-gray-500 mb-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "animate-spin w-3 h-3 border border-gray-500 border-t-transparent rounded-full" }), "Loading templates..."] })), error && ((0, jsx_runtime_1.jsxs)("div", { className: "mb-4 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700", children: ["Error: ", error] })), (0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: `template-select-${id}`, className: "block text-xs font-medium text-gray-700 mb-1", children: "Template" }), (0, jsx_runtime_1.jsxs)("select", { id: `template-select-${id}`, value: data.templateId || '', onChange: (e) => handleTemplateSelect(e.target.value), disabled: isLoading, className: "w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: isLoading ? 'Loading templates...' : 'Select a template...' }), templates.map((t) => ((0, jsx_runtime_1.jsx)("option", { value: t.id, children: t.name }, t.id)))] })] }), template && ((0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: `version-select-${id}`, className: "block text-xs font-medium text-gray-700 mb-1", children: "Version" }), (0, jsx_runtime_1.jsx)("select", { id: `version-select-${id}`, value: data.versionId || template.currentVersion, onChange: (e) => data.onVersionSelect?.(e.target.value), className: "w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500", children: template.versions.map((v) => ((0, jsx_runtime_1.jsxs)("option", { value: v.id, children: ["Version ", v.version, " ", v.name ? `- ${v.name}` : '', " (", v.label, ")"] }, v.id))) })] })), currentVersion && isExpanded && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsxs)("label", { className: "block text-xs font-medium text-gray-700 mb-2 flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Variable, { className: "w-3 h-3" }), "Variables"] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2 max-h-32 overflow-y-auto", children: Object.entries(currentVersion.variables).map(([key, defaultValue]) => ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: `variable-input-${id}-${key}`, className: "block text-xs text-gray-600 mb-1", children: key }), (0, jsx_runtime_1.jsx)("input", { id: `variable-input-${id}-${key}`, type: "text", value: data.variables?.[key] || defaultValue, onChange: (e) => handleVariableChange(key, e.target.value), className: "w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500", placeholder: `Enter ${key}...` })] }, key))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: `output-variable-input-${id}`, className: "block text-xs font-medium text-gray-700 mb-1", children: "Output Variable" }), (0, jsx_runtime_1.jsx)("input", { id: `output-variable-input-${id}`, type: "text", value: data.outputVariable || '', onChange: (e) => data.onOutputVariableChange?.(e.target.value), className: "w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500", placeholder: "Variable name for output..." })] })] })), isExecuting && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 text-xs text-blue-600 mb-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full" }), "Executing template on node ", id, "..."] })), executionResult && !isExecuting && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-2 p-2 bg-gray-50 rounded text-xs", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-1", children: [(0, jsx_runtime_1.jsxs)("span", { className: "font-medium", children: ["Result (Node ", id, "):"] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)("span", { className: `px-1 py-0.5 rounded text-xs ${executionResult.success
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'}`, children: executionResult.success ? 'Success' : 'Failed' }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setExecutionResult(null), className: "p-0.5 hover:bg-gray-200 rounded transition-colors", title: "Clear result", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "w-3 h-3" }) })] })] }), executionResult.success ? ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-gray-600", children: ["Response time: ", executionResult.responseTime, "ms", executionResult.tokenUsage && ((0, jsx_runtime_1.jsxs)("span", { className: "ml-2", children: ["\u2022 Tokens: ", executionResult.tokenUsage] }))] }), executionResult.result && ((0, jsx_runtime_1.jsxs)("div", { className: "bg-white p-2 rounded border text-gray-800 max-h-20 overflow-y-auto", children: [(0, jsx_runtime_1.jsx)("div", { className: "font-medium text-xs text-gray-500 mb-1", children: "Output:" }), (0, jsx_runtime_1.jsx)("div", { className: "text-xs", children: typeof executionResult.result === 'string'
                                                    ? executionResult.result.substring(0, 200) +
                                                        (executionResult.result.length > 200 ? '...' : '')
                                                    : JSON.stringify(executionResult.result, null, 2).substring(0, 200) + '...' })] }))] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "text-red-600", children: ["Error: ", executionResult.error] }))] }))] }), (0, jsx_runtime_1.jsx)(reactflow_1.Handle, { type: "source", position: reactflow_1.Position.Bottom, className: "w-3 h-3 bg-purple-500", id: `${id}-output` })] }));
};
exports.PromptTemplateNode = PromptTemplateNode;
exports.default = exports.PromptTemplateNode;
//# sourceMappingURL=PromptTemplateNode.js.map
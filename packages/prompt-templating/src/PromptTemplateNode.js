import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { Play, FileText, Variable, ChevronDown, ChevronUp, X } from 'lucide-react';
export const PromptTemplateNode = ({ id, data, selected }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [template, setTemplate] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [executionResult, setExecutionResult] = useState(null);
    const [error, setError] = useState(null);
    // Load templates on mount
    React.useEffect(() => {
        const loadTemplates = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const allTemplates = await data.templateService.listTemplates();
                setTemplates(allTemplates);
                if (data.templateId) {
                    const loadedTemplate = await data.templateService.getTemplate(data.templateId);
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
    const handleTemplateSelect = useCallback(async (templateId) => {
        try {
            setError(null);
            const selectedTemplate = await data.templateService.getTemplate(templateId);
            setTemplate(selectedTemplate);
            data.onTemplateSelect?.(templateId);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load template';
            setError(errorMessage);
            console.error(`Error selecting template for node ${id}:`, err);
        }
    }, [data, id]);
    const handleVariableChange = useCallback((key, value) => {
        const newVariables = {
            ...data.variables,
            [key]: value
        };
        data.onVariableChange?.(newVariables);
    }, [data]);
    const handleExecute = useCallback(async () => {
        if (!data.templateId)
            return;
        setIsExecuting(true);
        setError(null);
        try {
            console.log(`Executing template for node ${id}`);
            const result = await data.templateService.executeTemplate(data.templateId, data.versionId, data.variables);
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
    return (_jsxs("div", { id: `prompt-template-node-${id}`, className: `bg-white rounded-lg border-2 shadow-lg transition-all ${selected ? 'border-blue-500 shadow-blue-200' : 'border-gray-200'} ${isExpanded ? 'w-96' : 'w-64'}`, children: [_jsx(Handle, { type: "target", position: Position.Top, className: "w-3 h-3 bg-purple-500", id: `${id}-input` }), _jsx("div", { className: "p-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "p-2 bg-purple-100 rounded-md", children: _jsx(FileText, { className: "w-4 h-4 text-purple-600" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-900", children: "Prompt Template" }), _jsxs("p", { className: "text-xs text-gray-500", children: [template ? template.name : 'No template selected', " \u2022 Node: ", id] })] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: handleExecute, disabled: !data.templateId || isExecuting, className: "p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50", title: `Execute template (Node: ${id})`, children: _jsx(Play, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => setIsExpanded(!isExpanded), className: "p-1 hover:bg-gray-100 rounded transition-colors", title: "Toggle expanded view", children: isExpanded ? _jsx(ChevronUp, { className: "w-4 h-4" }) : _jsx(ChevronDown, { className: "w-4 h-4" }) })] })] }) }), _jsxs("div", { className: "p-4", children: [isLoading && (_jsxs("div", { className: "flex items-center gap-2 text-xs text-gray-500 mb-2", children: [_jsx("div", { className: "animate-spin w-3 h-3 border border-gray-500 border-t-transparent rounded-full" }), "Loading templates..."] })), error && (_jsxs("div", { className: "mb-4 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700", children: ["Error: ", error] })), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: `template-select-${id}`, className: "block text-xs font-medium text-gray-700 mb-1", children: "Template" }), _jsxs("select", { id: `template-select-${id}`, value: data.templateId || '', onChange: (e) => handleTemplateSelect(e.target.value), disabled: isLoading, className: "w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed", children: [_jsx("option", { value: "", children: isLoading ? 'Loading templates...' : 'Select a template...' }), templates.map(t => (_jsx("option", { value: t.id, children: t.name }, t.id)))] })] }), template && (_jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: `version-select-${id}`, className: "block text-xs font-medium text-gray-700 mb-1", children: "Version" }), _jsx("select", { id: `version-select-${id}`, value: data.versionId || template.currentVersion, onChange: (e) => data.onVersionSelect?.(e.target.value), className: "w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500", children: template.versions.map((v) => (_jsxs("option", { value: v.id, children: ["Version ", v.version, " ", v.name ? `- ${v.name}` : '', " (", v.label, ")"] }, v.id))) })] })), currentVersion && isExpanded && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-4", children: [_jsxs("label", { className: "block text-xs font-medium text-gray-700 mb-2 flex items-center gap-1", children: [_jsx(Variable, { className: "w-3 h-3" }), "Variables"] }), _jsx("div", { className: "space-y-2 max-h-32 overflow-y-auto", children: Object.entries(currentVersion.variables).map(([key, defaultValue]) => (_jsxs("div", { children: [_jsx("label", { htmlFor: `variable-input-${id}-${key}`, className: "block text-xs text-gray-600 mb-1", children: key }), _jsx("input", { id: `variable-input-${id}-${key}`, type: "text", value: data.variables?.[key] || defaultValue, onChange: (e) => handleVariableChange(key, e.target.value), className: "w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500", placeholder: `Enter ${key}...` })] }, key))) })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: `output-variable-input-${id}`, className: "block text-xs font-medium text-gray-700 mb-1", children: "Output Variable" }), _jsx("input", { id: `output-variable-input-${id}`, type: "text", value: data.outputVariable || '', onChange: (e) => data.onOutputVariableChange?.(e.target.value), className: "w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500", placeholder: "Variable name for output..." })] })] })), isExecuting && (_jsxs("div", { className: "flex items-center gap-2 text-xs text-blue-600 mb-2", children: [_jsx("div", { className: "animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full" }), "Executing template on node ", id, "..."] })), executionResult && !isExecuting && (_jsxs("div", { className: "mt-2 p-2 bg-gray-50 rounded text-xs", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsxs("span", { className: "font-medium", children: ["Result (Node ", id, "):"] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: `px-1 py-0.5 rounded text-xs ${executionResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`, children: executionResult.success ? 'Success' : 'Failed' }), _jsx("button", { onClick: () => setExecutionResult(null), className: "p-0.5 hover:bg-gray-200 rounded transition-colors", title: "Clear result", children: _jsx(X, { className: "w-3 h-3" }) })] })] }), executionResult.success ? (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "text-gray-600", children: ["Response time: ", executionResult.responseTime, "ms", executionResult.tokenUsage && (_jsxs("span", { className: "ml-2", children: ["\u2022 Tokens: ", executionResult.tokenUsage] }))] }), executionResult.result && (_jsxs("div", { className: "bg-white p-2 rounded border text-gray-800 max-h-20 overflow-y-auto", children: [_jsx("div", { className: "font-medium text-xs text-gray-500 mb-1", children: "Output:" }), _jsx("div", { className: "text-xs", children: typeof executionResult.result === 'string'
                                                    ? executionResult.result.substring(0, 200) + (executionResult.result.length > 200 ? '...' : '')
                                                    : JSON.stringify(executionResult.result, null, 2).substring(0, 200) + '...' })] }))] })) : (_jsxs("div", { className: "text-red-600", children: ["Error: ", executionResult.error] }))] }))] }), _jsx(Handle, { type: "source", position: Position.Bottom, className: "w-3 h-3 bg-purple-500", id: `${id}-output` })] }));
};
export default PromptTemplateNode;
//# sourceMappingURL=PromptTemplateNode.js.map
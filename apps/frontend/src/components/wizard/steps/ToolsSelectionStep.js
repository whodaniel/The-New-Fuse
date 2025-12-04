var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { File, Globe, Terminal, Code, Cpu, Github, Database, Clipboard, Cloud, ChevronDown } from 'lucide-react';
import { useWizard } from '../WizardProvider';
export var ToolsSelectionStep = function () {
    var _a;
    var _b = useWizard(), state = _b.state, updateSessionData = _b.updateSessionData;
    // Get existing data from session if available
    var existingData = ((_a = state.session) === null || _a === void 0 ? void 0 : _a.data) || {};
    // Form state
    var _c = useState(existingData.selectedTools || []), selectedTools = _c[0], setSelectedTools = _c[1];
    var _d = useState(existingData.selectedIntegrations || []), selectedIntegrations = _d[0], setSelectedIntegrations = _d[1];
    // Update session data when selections change
    useEffect(function () {
        updateSessionData({
            selectedTools: selectedTools,
            selectedIntegrations: selectedIntegrations
        });
    }, [selectedTools, selectedIntegrations, updateSessionData]);
    var handleToolsChange = function (values) {
        setSelectedTools(values);
    };
    var handleIntegrationsChange = function (values) {
        setSelectedIntegrations(values);
    };
    var handleSelectAll = function (category) {
        if (category === 'tools') {
            setSelectedTools([
                'save-file', 'edit-file', 'remove-files',
                'open-browser', 'web-search', 'web-fetch',
                'launch-process', 'kill-process', 'read-process', 'write-process', 'list-processes',
                'diagnostics', 'codebase-retrieval',
                'remember'
            ]);
        }
        else {
            setSelectedIntegrations([
                'github-api', 'linear', 'jira', 'confluence', 'notion', 'supabase'
            ]);
        }
    };
    var handleClearAll = function (category) {
        if (category === 'tools') {
            setSelectedTools([]);
        }
        else {
            setSelectedIntegrations([]);
        }
    };
    var toolCategories = [
        {
            name: 'File Management',
            icon: File,
            tools: [
                { id: 'save-file', label: 'Save File', description: 'Create new files with content' },
                { id: 'edit-file', label: 'Edit File', description: 'View, create, and edit files' },
                { id: 'remove-files', label: 'Remove Files', description: 'Safely delete files' },
            ]
        },
        {
            name: 'Web Interaction',
            icon: Globe,
            tools: [
                { id: 'open-browser', label: 'Open Browser', description: 'Open URLs in the default browser' },
                { id: 'web-search', label: 'Web Search', description: 'Search the web for information' },
                { id: 'web-fetch', label: 'Web Fetch', description: 'Fetch and convert webpage content to Markdown' },
            ]
        },
        {
            name: 'Process Management',
            icon: Terminal,
            tools: [
                { id: 'launch-process', label: 'Launch Process', description: 'Run shell commands' },
                { id: 'kill-process', label: 'Kill Process', description: 'Terminate processes' },
                { id: 'read-process', label: 'Read Process', description: 'Read output from a terminal' },
                { id: 'write-process', label: 'Write Process', description: 'Write input to a terminal' },
                { id: 'list-processes', label: 'List Processes', description: 'List all known terminals and their states' },
            ]
        },
        {
            name: 'Code Analysis',
            icon: Code,
            tools: [
                { id: 'diagnostics', label: 'Diagnostics', description: 'Get issues from the IDE' },
                { id: 'codebase-retrieval', label: 'Codebase Retrieval', description: 'Search the codebase for information' },
            ]
        },
        {
            name: 'Memory Tools',
            icon: Cpu,
            tools: [
                { id: 'remember', label: 'Remember', description: 'Create long-term memories' },
            ]
        },
    ];
    var integrationCategories = [
        {
            name: 'Development Tools',
            icon: Github,
            integrations: [
                { id: 'github-api', label: 'GitHub API', description: 'Interact with GitHub repositories, issues, and PRs' },
                { id: 'linear', label: 'Linear', description: 'Manage tasks and issues in Linear' },
            ]
        },
        {
            name: 'Project Management',
            icon: Clipboard,
            integrations: [
                { id: 'jira', label: 'Jira', description: 'Work with Jira issues and projects' },
                { id: 'confluence', label: 'Confluence', description: 'Access and update Confluence pages' },
            ]
        },
        {
            name: 'Knowledge Management',
            icon: Database,
            integrations: [
                { id: 'notion', label: 'Notion', description: 'Interact with Notion databases and pages' },
            ]
        },
        {
            name: 'Cloud Services',
            icon: Cloud,
            integrations: [
                { id: 'supabase', label: 'Supabase', description: 'Interact with Supabase databases and services' },
            ]
        },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Tools & Integrations" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Select the tools and integrations you want to enable for your AI assistants." }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-3", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900", children: "Tools" }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { className: "px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700", onClick: function () { return handleSelectAll('tools'); }, children: "Select All" }), _jsx("button", { className: "px-2 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50", onClick: function () { return handleClearAll('tools'); }, children: "Clear All" })] })] }), _jsx("div", { className: "space-y-2", children: toolCategories.map(function (category, idx) { return (_jsxs("details", { className: "bg-gray-50 rounded-md", open: idx === 0, children: [_jsxs("summary", { className: "p-3 cursor-pointer flex items-center justify-between hover:bg-gray-100 rounded-md", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(category.icon, { className: "w-4 h-4" }), _jsx("span", { className: "font-medium", children: category.name })] }), _jsx(ChevronDown, { className: "w-4 h-4" })] }), _jsx("div", { className: "pb-4 px-3", children: _jsx("div", { className: "space-y-3", children: category.tools.map(function (tool) { return (_jsxs("label", { className: "flex items-start space-x-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", value: tool.id, checked: selectedTools.includes(tool.id), onChange: function (e) {
                                                                if (e.target.checked) {
                                                                    setSelectedTools(__spreadArray(__spreadArray([], selectedTools, true), [tool.id], false));
                                                                }
                                                                else {
                                                                    setSelectedTools(selectedTools.filter(function (t) { return t !== tool.id; }));
                                                                }
                                                            }, className: "mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-900", children: tool.label }), _jsx("div", { className: "text-sm text-gray-600", children: tool.description })] })] }, tool.id)); }) }) })] }, idx)); }) })] }), _jsx("hr", { className: "border-gray-200" }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-3", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900", children: "Integrations" }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { className: "px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700", onClick: function () { return handleSelectAll('integrations'); }, children: "Select All" }), _jsx("button", { className: "px-2 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50", onClick: function () { return handleClearAll('integrations'); }, children: "Clear All" })] })] }), _jsx("div", { className: "space-y-2", children: integrationCategories.map(function (category, idx) { return (_jsxs("details", { className: "bg-gray-50 rounded-md", open: idx === 0, children: [_jsxs("summary", { className: "p-3 cursor-pointer flex items-center justify-between hover:bg-gray-100 rounded-md", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(category.icon, { className: "w-4 h-4" }), _jsx("span", { className: "font-medium", children: category.name })] }), _jsx(ChevronDown, { className: "w-4 h-4" })] }), _jsx("div", { className: "pb-4 px-3", children: _jsx("div", { className: "space-y-3", children: category.integrations.map(function (integration) { return (_jsxs("label", { className: "flex items-start space-x-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", value: integration.id, checked: selectedIntegrations.includes(integration.id), onChange: function (e) {
                                                                if (e.target.checked) {
                                                                    setSelectedIntegrations(__spreadArray(__spreadArray([], selectedIntegrations, true), [integration.id], false));
                                                                }
                                                                else {
                                                                    setSelectedIntegrations(selectedIntegrations.filter(function (i) { return i !== integration.id; }));
                                                                }
                                                            }, className: "mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-900", children: integration.label }), _jsx("div", { className: "text-sm text-gray-600", children: integration.description })] })] }, integration.id)); }) }) })] }, idx)); }) })] }), _jsx("div", { className: "bg-blue-50 p-4 rounded-md", children: _jsxs("p", { className: "text-sm text-blue-800", children: [_jsx("strong", { children: "Note:" }), " You can always change these settings later in your workspace settings."] }) })] })] }));
};
